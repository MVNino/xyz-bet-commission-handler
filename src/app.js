import express from "express";
import db from "./config/database.js";
import dotenv from "dotenv";
import { WalletService } from "./services/wallet.service.js";

dotenv.config();
const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check for DB connection
db.authenticate()
  .then(() => console.info("Connection established!"))
  .catch((error) => console.error(`Error: ${error}`));

const walletService = new WalletService();

// Seed main wallet table
app.post("/wallet/seed", async (req, res) => {
  await walletService.seedWalletRecords();

  res.send("Done");
});

// Fetch main wallet table
app.get("/wallet", async (req, res) => {
  await walletService.getWalletRecords();

  res.send("Done");
});

// Start The Fight: Put player's new balance to a temporary table
app.post("/wallet/make-temporary-table", async (req, res) => {
  await walletService.createTemporaryWalletTable();

  res.send("Done");
});

// If finish, merge the temporary table to the main table (wallet)
app.post("/wallet/merge-temporary-to-main-table", async (req, res) => {
  await walletService.mergeTemporaryToMainTable();

  res.send("Done.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
