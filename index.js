const express = require("express");
const mysql = require("mysql");

// Create connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "xyz_bet_commission_handler",
});

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Route to fetch data from the database
app.get("/wallet", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to database: " + err.stack);
      return res.status(500).send("Error connecting to database");
    }

    connection.query("SELECT * FROM wallet", (error, results) => {
      connection.release(); // Release connection after query
      if (error) {
        console.error("Error querying database: " + error.stack);
        return res.status(500).send("Error querying database");
      }

      res.json(results); // Send the results as JSON
    });
  });
});

// Route to seed records into the wallet table
app.post("/seed-wallet", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to database: " + err.stack);
      return res.status(500).json({ message: "Error connecting to database" });
    }

    const collectedInput = Array.from({ length: 100 }, (_, i) => {
      return [i + 1, 10];
    });

    for (let i = 1; i <= 100; i++) {
      const sql = "INSERT INTO wallet (user_id, balance) VALUES (?, ?)";
      const values = [i, 10];

      connection.query(sql, values, (error, results) => {
        // connection.release(); // Release connection after query
        if (error) {
          console.error(
            "Error inserting record into wallet table: " + error.stack
          );
          return res
            .status(500)
            .json({ message: "Error inserting record into wallet table" });
        }
      });
    }

    connection.release();

    res.status(201).json({
      message: "Records inserted successfully",
    });
  });
});

/**
 * PAYLOAD
 * 
  {
    "tableName": "temp_table",
    "columns": [
      { "name": "id", "type": "INT", "constraints": "PRIMARY KEY AUTO_INCREMENT" },
      { "name": "name", "type": "VARCHAR(255)" }
    ]
  }
 */

// Start The Fight: Put player's new balance to a temporary table
// Route to create a new temporary table
app.post("/wallet/temporary-table", (req, res) => {
  // const { tableName, columns } = req.body;
  const tableName = "wallet_temp_001";
  const columns = [
    {
      name: "id",
      type: "INT",
      constraints: "PRIMARY KEY AUTO_INCREMENT",
    },
    {
      name: "user_id",
      type: "INT",
      constraints: "NOT NULL",
    },
    {
      name: "is_meron",
      type: "TINYINT(1)",
      constraints: "DEFAULT 1",
    },
  ];

  // Validate request body
  if (
    !tableName ||
    !columns ||
    !Array.isArray(columns) ||
    columns.length === 0
  ) {
    return res
      .status(400)
      .json({
        message:
          "Invalid request body. Expected tableName and non-empty array of columns.",
      });
  }

  // Construct SQL query to create the temporary table
  let sql = `CREATE TEMPORARY TABLE ${tableName} (`;
  columns.forEach((column, index) => {
    if (index !== 0) sql += ", ";
    sql += `${column.name} ${column.type}`;
    if (column.constraints) {
      sql += ` ${column.constraints}`;
    }
  });
  sql += ")";

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to database: " + err.stack);
      return res.status(500).json({ message: "Error connecting to database" });
    }

    connection.query(sql, (error, results) => {
      connection.release(); // Release connection after query
      if (error) {
        console.error("Error creating temporary table: " + error.stack);
        return res
          .status(500)
          .json({ message: "Error creating temporary table" });
      }

      res
        .status(201)
        .json({ message: `Temporary table ${tableName} created successfully` });
    });
  });
});

// If finish, merge the temporary table to the main table (wallet)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
