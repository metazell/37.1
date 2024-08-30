const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Get list of invoices
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: result.rows });
  } catch (err) {
    return next(err);
  }
});

// Get a single invoice by ID
router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    const invoiceResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices WHERE id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new ExpressError(`Invoice with ID ${id} not found`, 404);
    }

    const invoice = invoiceResult.rows[0];

    const companyResult = await db.query(
      `SELECT code, name, description FROM companies WHERE code = $1`,
      [invoice.comp_code]
    );

    invoice.company = companyResult.rows[0];

    return res.json({ invoice });
  } catch (err) {
    return next(err);
  }
});

// Create a new invoice
router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Update an existing invoice
router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;

    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid FROM invoices WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`Invoice with ID ${id} not found`, 404);
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Delete an invoice
router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice with ID ${id} not found`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
