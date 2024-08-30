const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const db = require("../db");
const ExpressError = require("../expressError");

// Get list of companies
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

// Get a single company by code
router.get("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const companyResult = await db.query(
      `SELECT code, name, description FROM companies WHERE code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Company with code ${code} not found`, 404);
    }

    const invoiceResult = await db.query(
      `SELECT id FROM invoices WHERE comp_code = $1`,
      [code]
    );

    const company = companyResult.rows[0];
    company.invoices = invoiceResult.rows.map(inv => inv.id);

    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

// Create a new company
router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true, strict: true });

    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Update an existing company
router.put("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Company with code ${code} not found`, 404);
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Delete a company
router.delete("/:code", async function (req, res, next) {
  try {
    const { code } = req.params;
    const result = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Company with code ${code} not found`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
