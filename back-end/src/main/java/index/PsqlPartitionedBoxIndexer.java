package index;

import box.Box;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Random;
import jdk.nashorn.api.scripting.NashornScriptEngine;
import main.Config;
import main.DbConnector;
import main.Main;
import project.Canvas;
import project.Layer;
import project.Project;
import project.Transform;

public class PsqlPartitionedBoxIndexer extends BoundingBoxIndexer {

    private static PsqlPartitionedBoxIndexer instance = null;
    private static final int NUM_PARTITIONS = 10;

    private PsqlPartitionedBoxIndexer() {}

    public static synchronized PsqlPartitionedBoxIndexer getInstance() {
        if (instance == null) instance = new PsqlPartitionedBoxIndexer();
        return instance;
    }

    protected void debug(String msg) {
        System.out.println("[DEBUG]:  " + msg);
    }

    @Override
    public void createMV(Canvas c, int layerId) throws Exception {
        Statement bboxStmt = DbConnector.getStmtByDbName(Config.databaseName);
        Layer l = c.getLayers().get(layerId);
        Transform trans = l.getTransform();
        ArrayList colNames = trans.getColumnNames();
        Project proj = Main.getProject();
        ArrayList<Canvas> canvases = proj.getCanvases();
        Canvas topCanvas = canvases.get(0);
        Canvas bottomCanvas = canvases.get(canvases.size() - 1);

        // step 0: create tables for storing bboxes and tiles
        // put all canvases and layers in same table
        String bboxTableName = "bbox_" + Main.getProject().getName() + "_" + c.getId() + "layer" + layerId;

        // drop table if exists -- NO DON'T WANT TO DROP TABLE NOW ONE BIG TABLE
        // String sql = "drop table if exists " + bboxTableName + ";";
        // bboxStmt.executeUpdate(sql);

        // create the bbox table
        String sql = "";
        sql = "drop table if exists " + bboxTableName + ";";
        bboxStmt.executeUpdate(sql);
        sql = "CREATE UNLOGGED TABLE " + bboxTableName + " (";
        for (int i = 0; i < colNames.size(); i++) sql += colNames.get(i) + " text, ";
        // need to add value based on canvas id and layer id
        sql +=
                "cx double precision, cy double precision, " +
                "minx double precision, miny double precision, " +
                "maxx double precision, maxy double precision, " +
                "geom box, partition_id int) " +
                "PARTITION BY LIST (partition_id);";
        System.out.println(sql);
        bboxStmt.executeUpdate(sql);

        // create the bbox table's partitions
        for (int i = 0; i < NUM_PARTITIONS; i++) {
            sql = 
                "CREATE UNLOGGED TABLE "
                    + bboxTableName
                    + "_"
                    + i
                    + " PARTITION OF "
                    + bboxTableName
                    + " FOR VALUES IN ("
                    + i
                    + ");";
            System.out.println(sql);
            bboxStmt.executeUpdate(sql);
        }
        

        // if this is an empty layer, return
        if (trans.getDb().equals("")) return;

        // step 1: set up nashorn environment
        NashornScriptEngine engine = null;
        if (!trans.getTransformFunc().equals("")) engine = setupNashorn(trans.getTransformFunc());

        // step 2: looping through query results
        Statement rawDBStmt = DbConnector.getStmtByDbName(trans.getDb(), true);
        ResultSet rs = DbConnector.getQueryResultIterator(rawDBStmt, trans.getQuery());
        int numColumn = rs.getMetaData().getColumnCount();
        int rowCount = 0;
        
        String insertSql = "insert into " + bboxTableName + " values (";
        for (int i = 0; i < colNames.size() + 6; i++) {
            insertSql += "?, ";
        }
        insertSql += "?::box, ";
        insertSql += "?);";
        PreparedStatement preparedStmt =
                DbConnector.getPreparedStatement(Config.databaseName, insertSql);
        while (rs.next()) {

            // count log
            rowCount++;
            if (rowCount % 1000000 == 0) System.out.println(rowCount);

            // get raw row
            ArrayList<String> curRawRow = new ArrayList<>();
            for (int i = 1; i <= numColumn; i++) curRawRow.add(rs.getString(i));

            // step 3: run transform function on this tuple
            ArrayList<String> transformedRow;
            if (!trans.getTransformFunc().equals(""))
                transformedRow = getTransformedRow(c, curRawRow, engine);
            else transformedRow = curRawRow;

            // step 4: calculate bounding boxes
            ArrayList<Double> curBbox = getBboxCoordinates(l, transformedRow);

            // insert into bbox table
            for (int i = 0; i < transformedRow.size(); i++)
                preparedStmt.setString(i + 1, transformedRow.get(i).replaceAll("\'", "\'\'"));
            // preparedStmt.setString(i + 1, transformedRow.get(i));
            for (int i = 0; i < 6; i++)
                preparedStmt.setDouble(transformedRow.size() + i + 1, curBbox.get(i));

            double cx, minx, miny, maxx, maxy;
            cx = curBbox.get(0);
            minx = curBbox.get(2);
            miny = curBbox.get(3);
            maxx = curBbox.get(4);
            maxy = curBbox.get(5);

            preparedStmt.setString(
                    transformedRow.size() + 7,  getBoxText(minx, miny, maxx, maxy));

            // calculate partition id -- partition width into equal sized buckets
            // each partition will include all z values in that width, so it is more 
            // of a equal size slice through the canvases, only supports one pyramid right now though
            if (!c.getwSql().isEmpty())
                throw new IllegalArgumentException(
                    "Canvas " + c.getId() + " has non-fixed width, partition failed.");

            // it was this, before but it was causing errors
            // preparedStmt.setString(transformedRow.size() + 8, "floor(" + cx + "::float / " + partitionWidth + ") ");
            double partitionWidth = (double) ((c.getW() + 1) / NUM_PARTITIONS);
            // System.out.println("cx is: " + cx + ", partitionWidth is: " + partitionWidth + ", and non-floored partition id is: " + ((float )cx / partitionWidth));
            double partitionRatio = cx / partitionWidth;
            int partitionId = (int) Math.floor(partitionRatio);
            if (partitionId > (NUM_PARTITIONS - 1)) {
                System.out.println("partitionId is too high, is: " + partitionId + " before correcting");
                partitionId = NUM_PARTITIONS - 1;
            }
            preparedStmt.setInt(transformedRow.size() + 8, partitionId);

            
            preparedStmt.addBatch();

            if (rowCount % Config.bboxBatchSize == 0) {
                preparedStmt.executeBatch();
            }
        }
        rs.close();
        rawDBStmt.close();
        DbConnector.closeConnection(trans.getDb());

        // insert tail stuff
        if (rowCount % Config.bboxBatchSize != 0) {
            preparedStmt.executeBatch();
        }
        preparedStmt.close();

        
        /*
        sql: create index idx_tbl_box_1 on tbl_box using gist (geom);
        */
        sql =
                "create index box_idx_"
                        + bboxTableName
                        + " on "
                        + bboxTableName
                        + " using gist (geom);";
        System.out.println(sql);
        long st = System.currentTimeMillis();
        bboxStmt.executeUpdate(sql);
        System.out.println(
            "Creating spatial indexes took: "
                + (System.currentTimeMillis() - st) / 1000.0
                + "s.");

        // CLUSTER
        // note: postgres automatically makes child indices for the partitions 
        // with the suffix '_geom_idx' and since CLUSTER doesn't propagate to the 
        // child indices, we have to loop through and call it a bunch of times
        st = System.currentTimeMillis();
        for (int i = 0; i < NUM_PARTITIONS; i++) {
            sql =
                    "CLUSTER "
                            + bboxTableName
                            + "_"
                            + i
                            + " USING "
                            + bboxTableName
                            + "_"
                            + i
                            + "_geom_idx;";
            System.out.println(sql);
            long stt = System.currentTimeMillis();
            bboxStmt.executeUpdate(sql);
            System.out.println(
                    "CLUSTERing Partition #"
                            + i
                            + " took "
                            + (System.currentTimeMillis() - stt) / 1000.0
                            + "s.");
        }
        System.out.println(
            "CLUSTERing in total took: " + (System.currentTimeMillis() - st) / 1000.0 + "s.");
        bboxStmt.close();
    }

    @Override
    public ArrayList<ArrayList<String>> getDataFromRegion(
            Canvas c, int layerId, String regionWKT, String predicate, Box newBox, Box oldBox)
            throws Exception {

        double minx = newBox.getMinx(), miny = newBox.getMiny();
        double maxx = newBox.getMaxx(), maxy = newBox.getMaxy();

        String boxNew =
                "box (" + "point(" + minx + ", " + miny + "), " + "point(" + maxx
                        + ", " + maxy + "))";

        String boxOld = 
                "box (" + "point(" + oldBox.getMinx() + ", " + oldBox.getMiny() + "), " 
                    + "point(" + oldBox.getMaxx()
                    + ", " + oldBox.getMaxy() + "))";

        // final data to be returned
        ArrayList<ArrayList<String>> ret = new ArrayList<>();

        // get column list string
        String colListStr = c.getLayers().get(layerId).getColStr("");
        String bboxTableName = "bbox_" + Main.getProject().getName() + "_" + c.getId() + "layer" + layerId;

        // find range of partition ids to search
        double partitionWidth = (double) c.getW() / NUM_PARTITIONS;
        int minPartitionId = (int) Math.floor(minx / partitionWidth);
        int maxPartitionId = (int) Math.floor(maxx / partitionWidth);

        System.out.println("in psql partitioned box spatial indexer");
        for (int i = minPartitionId; i <= maxPartitionId; i++) {
            // construct range query
            String sql =
            "select "
                    + colListStr
                    + " from " 
                    + bboxTableName
                    + "_"
                    + i
                    + " where geom && ";
            sql += boxNew;
            sql += " and not (geom && " + boxOld + ")";
            if (predicate.length() > 0) sql += " and " + predicate + ";";
            else sql += ";";
            System.out.println(sql);

            ret.addAll(DbConnector.getQueryResult(Config.databaseName, sql));
        }
                
        return ret;
    }

    @Override
    public ArrayList<ArrayList<String>> getDataFromTile(
            Canvas c, int layerId, int minx, int miny, String predicate) throws Exception {

        // get column list string
        String colListStr = c.getLayers().get(layerId).getColStr("");

        String tileBox =
                "box ("
                        + "point("
                        + minx
                        + ", "
                        + miny
                        + "), "
                        + "point("
                        + (minx + Config.tileW)
                        + ", "
                        + (miny + Config.tileH)
                        + "))";

        // construct range query
        String sql =
                "select "
                        + colListStr
                        + " from bbox_"
                        + Main.getProject().getName() + "_" + c.getId() + "layer" + layerId
                        + " where geom && "
                        + tileBox;

        if (predicate.length() > 0) sql += " and " + predicate + ";";
        else sql += ";";

        // return
        return DbConnector.getQueryResult(Config.databaseName, sql);
    }

    private static String getBoxText(
            double minx, double miny, double maxx, double maxy) {

        String boxText = "(";
        /*
        sql: box(point(minx, miny), point(maxx, maxy))
        */
        boxText +=
                "("
                        + String.valueOf(minx)
                        + ", "
                        + String.valueOf(miny)
                        + "), "
                        + "("
                        + String.valueOf(maxx)
                        + ", "
                        + String.valueOf(maxy)
                        + "))";

        return boxText;
    }
}
