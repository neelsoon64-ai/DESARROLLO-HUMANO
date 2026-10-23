const normalizar = (valor) => String(valor || "").trim().toLocaleLowerCase();

export const crearArticuloId = (categoria, descripcion, unidad = "unidades") =>
  [categoria, descripcion, unidad].map(normalizar).join("::");

const claveArticulo = (movimiento) =>
  movimiento.articuloId ||
  crearArticuloId(movimiento.categoria, movimiento.descripcion, movimiento.unidad);

export const crearClaveStockHistorico = (movimiento) =>
  [
    movimiento.origen || "",
    "historico",
    claveArticulo(movimiento),
    normalizar(movimiento.numero_expediente),
    normalizar(movimiento.nroRemito),
    normalizar(movimiento.orden_compra),
  ].join("::");

const esIngreso = (movimiento) =>
  ["ingreso", "inicial", "entrada"].includes(normalizar(movimiento.tipo));

const esEgreso = (movimiento) =>
  ["egreso", "salida"].includes(normalizar(movimiento.tipo));

const claveDetalle = (movimiento) =>
  movimiento.compraId
    ? `${movimiento.origen || ""}::compra::${movimiento.compraId}::${claveArticulo(movimiento)}`
    : movimiento.legacyStockKey || crearClaveStockHistorico(movimiento);

export function calcularStockDetallado(movimientos = []) {
  const acumulado = new Map();

  movimientos.filter(Boolean).forEach((movimiento) => {
    if (!movimiento.descripcion) return;

    const id = claveDetalle(movimiento);
    if (!acumulado.has(id)) {
      acumulado.set(id, {
        id,
        stockKey: id,
        articuloId: claveArticulo(movimiento),
        compraId: movimiento.compraId || null,
        expedienteId: movimiento.expedienteId || null,
        numero_expediente: movimiento.numero_expediente || "",
        nroRemito: movimiento.nroRemito || "",
        orden_compra: movimiento.orden_compra || "",
        fechaCompra: movimiento.fechaCompra || "",
        proveedor: movimiento.proveedor || "",
        origen: movimiento.origen || "",
        descripcion: movimiento.descripcion,
        categoria: movimiento.categoria || "General",
        unidad: movimiento.unidad || "unidades",
        ingresos: 0,
        egresos: 0,
        stock: 0,
        movimientos: [],
      });
    }

    const articulo = acumulado.get(id);
    if (!articulo.numero_expediente && movimiento.numero_expediente) {
      articulo.numero_expediente = movimiento.numero_expediente;
      articulo.expedienteId = movimiento.expedienteId || null;
    }
    const cantidad = Number(movimiento.cantidad);
    const cantidadValida = Number.isFinite(cantidad) ? cantidad : 0;

    if (esIngreso(movimiento)) articulo.ingresos += cantidadValida;
    if (esEgreso(movimiento)) articulo.egresos += cantidadValida;
    articulo.stock = articulo.ingresos - articulo.egresos;
    articulo.movimientos.push(movimiento);
  });

  return [...acumulado.values()].sort(
    (a, b) =>
      a.descripcion.localeCompare(b.descripcion) ||
      a.categoria.localeCompare(b.categoria) ||
      a.numero_expediente.localeCompare(b.numero_expediente) ||
      String(a.compraId || "").localeCompare(String(b.compraId || ""))
  );
}

export function consolidarStock(stockDetallado = []) {
  const acumulado = new Map();

  stockDetallado.forEach((articulo) => {
    const id = articulo.articuloId;
    if (!acumulado.has(id)) {
      acumulado.set(id, {
        ...articulo,
        id,
        stockKey: "",
        compraId: null,
        expedienteId: null,
        numero_expediente: "",
        nroRemito: "",
        orden_compra: "",
        ingresos: 0,
        egresos: 0,
        stock: 0,
        compras: [],
        movimientos: [],
      });
    }

    const total = acumulado.get(id);
    total.ingresos += articulo.ingresos;
    total.egresos += articulo.egresos;
    total.stock += articulo.stock;
    total.movimientos.push(...articulo.movimientos);
    total.compras.push(articulo);
  });

  return [...acumulado.values()].sort(
    (a, b) =>
      a.descripcion.localeCompare(b.descripcion) ||
      a.categoria.localeCompare(b.categoria)
  );
}

export function calcularStockDisponible(
  movimientos = [],
  { articuloId, compraId, legacyStockKey, origen, excluirId } = {}
) {
  return movimientos.reduce((total, movimiento) => {
    if (!movimiento || String(movimiento.id) === String(excluirId)) return total;
    const mismoArticulo = (movimiento.articuloId || claveArticulo(movimiento)) === articuloId;
    const mismoAlcance = compraId
      ? movimiento.compraId === compraId && (!origen || movimiento.origen === origen)
      : !movimiento.compraId &&
        (!origen || !movimiento.origen || movimiento.origen === origen) &&
        (movimiento.legacyStockKey || crearClaveStockHistorico({ ...movimiento, origen })) === legacyStockKey;
    if (!mismoArticulo || !mismoAlcance) return total;

    const cantidad = Number(movimiento.cantidad);
    const cantidadValida = Number.isFinite(cantidad) ? cantidad : 0;
    if (esIngreso(movimiento)) return total + cantidadValida;
    if (esEgreso(movimiento)) return total - cantidadValida;
    return total;
  }, 0);
}

export function filtrarInventario(
  items = [],
  { articulo = "", expediente = "", compra = "", remito = "", categoria = "Todas" } = {}
) {
  const coincide = (filtro, valores) => {
    const termino = normalizar(filtro);
    return !termino || valores.some((valor) => normalizar(valor).includes(termino));
  };

  return items.filter((item) => {
    const registros = item.compras || [item];
    return (
      coincide(articulo, [item.descripcion]) &&
      coincide(expediente, registros.map((registro) => registro.numero_expediente)) &&
      coincide(compra, registros.flatMap((registro) => [registro.compraId, registro.orden_compra])) &&
      coincide(remito, registros.map((registro) => registro.nroRemito)) &&
      (categoria === "Todas" || item.categoria === categoria)
    );
  });
}

export function movimientosConStockResultante(movimientos = []) {
  const items = movimientos
    .filter(Boolean)
    .map((movimiento, indice) => {
      const fecha = movimiento.fechaCarga || movimiento.fecha || "";
      const timestamp = fecha ? Date.parse(fecha) : Number.NaN;
      return {
        movimiento,
        indice,
        timestamp: Number.isFinite(timestamp) ? timestamp : null,
      };
    })
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) return a.indice - b.indice;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return a.timestamp - b.timestamp || a.indice - b.indice;
    });

  const fechasConfiables = items.every((item) => item.timestamp !== null);
  let saldo = 0;
  let calculable = fechasConfiables;
  const conSaldo = items.map(({ movimiento, timestamp }) => {
    const cantidad = Number(movimiento.cantidad);
    const esIngresoMovimiento = esIngreso(movimiento);
    const esEgresoMovimiento = esEgreso(movimiento);

    if (
      !calculable ||
      !Number.isFinite(cantidad) ||
      cantidad < 0 ||
      (!esIngresoMovimiento && !esEgresoMovimiento)
    ) {
      calculable = false;
      return { ...movimiento, stockResultante: null, _timestamp: timestamp };
    }

    saldo += esIngresoMovimiento ? cantidad : -cantidad;
    return { ...movimiento, stockResultante: saldo, _timestamp: timestamp };
  });

  return conSaldo
    .sort((a, b) => {
      if (a._timestamp === null && b._timestamp === null) return 0;
      if (a._timestamp === null) return 1;
      if (b._timestamp === null) return -1;
      return b._timestamp - a._timestamp;
    })
    .map(({ _timestamp, ...movimiento }) => movimiento);
}
