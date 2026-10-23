import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularStockDetallado,
  calcularStockDisponible,
  consolidarStock,
  crearArticuloId,
  crearClaveStockHistorico,
  filtrarInventario,
  movimientosConStockResultante,
} from "../src/inventoryModel.js";

const articulo = {
  descripcion: "Atún en lata",
  categoria: "alimentos",
  unidad: "cajas",
};

const movimientosCompras = [
  {
    ...articulo,
    id: "ingreso-1",
    tipo: "ingreso",
    cantidad: 10,
    compraId: "compra-1",
    expedienteId: "exp-1",
    numero_expediente: "EXP-1",
    nroRemito: "REM-1",
    origen: "nacion",
  },
  {
    ...articulo,
    id: "ingreso-2",
    tipo: "ingreso",
    cantidad: 20,
    compraId: "compra-2",
    expedienteId: "exp-2",
    numero_expediente: "EXP-2",
    nroRemito: "REM-2",
    origen: "nacion",
  },
  {
    ...articulo,
    id: "egreso-1",
    tipo: "egreso",
    cantidad: 4,
    compraId: "compra-1",
    expedienteId: "exp-1",
    numero_expediente: "EXP-1",
    origen: "nacion",
  },
];

test("mantiene el mismo artículo separado entre compras y descuenta sólo la compra seleccionada", () => {
  const detalle = calcularStockDetallado(movimientosCompras);
  assert.equal(detalle.find((item) => item.compraId === "compra-1").stock, 6);
  assert.equal(detalle.find((item) => item.compraId === "compra-2").stock, 20);

  assert.equal(
    calcularStockDisponible(movimientosCompras, {
      articuloId: crearArticuloId(articulo.categoria, articulo.descripcion, articulo.unidad),
      compraId: "compra-1",
      origen: "nacion",
    }),
    6
  );
  assert.equal(
    calcularStockDisponible(movimientosCompras, {
      articuloId: crearArticuloId(articulo.categoria, articulo.descripcion, articulo.unidad),
      compraId: "compra-2",
      origen: "nacion",
    }),
    20
  );
});

test("consolida el total general sin duplicar movimientos", () => {
  const movimientos = [
    ...movimientosCompras,
    { ...articulo, id: "historico", tipo: "ingreso", cantidad: 5, origen: "provincia" },
  ];
  const global = consolidarStock(calcularStockDetallado(movimientos));
  assert.equal(global.length, 1);
  assert.equal(global[0].ingresos, 35);
  assert.equal(global[0].egresos, 4);
  assert.equal(global[0].stock, 31);
});

test("conserva el histórico sin compra y filtra por artículo, expediente y remito", () => {
  const movimientos = [
    ...movimientosCompras,
    { ...articulo, id: "historico", tipo: "ingreso", cantidad: 5, origen: "provincia" },
  ];
  const detalle = calcularStockDetallado(movimientos);
  assert.equal(detalle.some((item) => !item.compraId && item.stock === 5), true);

  const global = consolidarStock(detalle);
  assert.equal(filtrarInventario(global, { articulo: "atún" }).length, 1);
  assert.equal(filtrarInventario(global, { expediente: "exp-2" }).length, 1);
  assert.equal(filtrarInventario(global, { remito: "rem-1" }).length, 1);
});

test("una salida histórica usa su clave de stock y no el saldo de otra compra", () => {
  const claveHistorica = crearClaveStockHistorico({
    ...articulo,
    origen: "provincia",
    numero_expediente: "EXP-H",
    nroRemito: "REM-H",
  });
  const movimientos = [
    { ...articulo, id: "hist-in", tipo: "ingreso", cantidad: 9, origen: "provincia", numero_expediente: "EXP-H", nroRemito: "REM-H" },
    { ...articulo, id: "hist-out", tipo: "egreso", cantidad: 2, origen: "provincia", legacyStockKey: claveHistorica },
    { ...articulo, id: "other-in", tipo: "ingreso", cantidad: 50, origen: "provincia", compraId: "compra-separada" },
  ];
  assert.equal(
    calcularStockDisponible(movimientos, {
      articuloId: crearArticuloId(articulo.categoria, articulo.descripcion, articulo.unidad),
      legacyStockKey: claveHistorica,
      origen: "provincia",
    }),
    7
  );
});

test("ordena los movimientos recientes primero y calcula saldo sólo con cronología confiable", () => {
  const historial = movimientosConStockResultante([
    { id: "entrada", tipo: "ingreso", cantidad: 10, fechaCarga: "2026-01-01T10:00:00.000Z" },
    { id: "salida", tipo: "egreso", cantidad: 4, fechaCarga: "2026-01-02T10:00:00.000Z" },
  ]);
  assert.deepEqual(historial.map((movimiento) => movimiento.id), ["salida", "entrada"]);
  assert.deepEqual(historial.map((movimiento) => movimiento.stockResultante), [6, 10]);

  const conAjuste = movimientosConStockResultante([
    { id: "entrada", tipo: "ingreso", cantidad: 10, fechaCarga: "2026-01-01T10:00:00.000Z" },
    { id: "ajuste", tipo: "ajuste", cantidad: 2, fechaCarga: "2026-01-02T10:00:00.000Z" },
  ]);
  assert.equal(conAjuste.find((movimiento) => movimiento.id === "entrada").stockResultante, 10);
  assert.equal(conAjuste.find((movimiento) => movimiento.id === "ajuste").stockResultante, null);
});
