import test from "node:test";
import assert from "node:assert/strict";
import { authorize } from "../src/middlewares/authorize.middleware.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test("authorize devuelve 401 sin autenticación", () => {
  const req = {};
  const res = mockRes();
  let nextCalled = false;

  authorize("admin")(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "No autenticado");
  assert.equal(nextCalled, false);
});

test("authorize devuelve 403 con autenticación sin rol permitido", () => {
  const req = { user: { role: "user" } };
  const res = mockRes();
  let nextCalled = false;

  authorize("admin")(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "No tenés permisos para realizar esta acción");
  assert.equal(nextCalled, false);
});

test("authorize permite el rol autorizado", () => {
  const req = { user: { role: "admin" } };
  const res = mockRes();
  let nextCalled = false;

  authorize("admin")(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test("errorMiddleware conserva los códigos de negocio", () => {
  const cases = [
    [400, "Datos inválidos"],
    [401, "No autenticado"],
    [403, "Sin permisos"],
    [404, "No encontrado"],
    [409, "Conflicto"]
  ];

  for (const [status, message] of cases) {
    const res = mockRes();
    errorMiddleware({ status, message }, {}, res, () => {});
    assert.equal(res.statusCode, status);
    assert.equal(res.body.message, message);
  }
});

test("errorMiddleware convierte errores inesperados en 500", () => {
  const res = mockRes();
  errorMiddleware(new Error("secret internal detail"), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, "Error interno del servidor");
});
