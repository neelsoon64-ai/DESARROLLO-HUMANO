const handleGuardar = async () => {
    if (!form.descripcion.trim()) return setError("Ingresá una descripción.");
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      return setError("Ingresá una cantidad válida.");
    setError("");

    const id = inicial?.id || generarId();
    setSubiendo(true);

    try {
      const inicialFotosArray = Array.isArray(inicial.foto) ? inicial.foto : (inicial.foto ? [inicial.foto] : []);
      
      // ─── 🛡️ ESCUDO Y PROCESAMIENTO SEGURO DE FOTOS ───
      const fotosDesdeForm = await Promise.all(
        form.listaFotos.map(async (f, idx) => {
          if (f.url) return f.url; // Si ya tiene URL de Drive guardada, se conserva
          
          // Si es una foto nueva, le pasamos f.preview (el Base64 limpio)
          if (f.preview && !f.preview.startsWith("http")) {
            try {
              console.log(`Subiendo foto index ${idx} a Google Drive...`);
              return await subirFotoRemito(f.preview, `${id}-${idx}`);
            } catch (driveErr) {
              console.error("Fallo la subida a Drive para esta imagen:", driveErr);
              return ""; // Si falla, retorna vacío pero no interrumpe el bucle
            }
          }
          return f.preview || "";
        })
      );

      // Consolidamos y limpiamos las URLs de las fotos
      let fotoFinalArray = [...inicialFotosArray, ...fotosDesdeForm.filter(Boolean)];
      fotoFinalArray = fotoFinalArray.filter((v, i, a) => a.indexOf(v) === i);

      const fotoFinal = fotoFinalArray.length === 0 ? "" : (fotoFinalArray.length === 1 ? fotoFinalArray[0] : fotoFinalArray);

      console.debug("ModalRemito: Guardando payload final.", { fotoFinal });

      const proveedorFinal = form.tipo === "inicial" && !form.proveedor.trim() 
        ? "Inventario Físico Inicial" 
        : form.proveedor.trim();

      const fechaFinal = new Date(form.fecha).toISOString();

      // ─── 🚀 GUARDADO GARANTIZADO EN FIREBASE ───
      onGuardar({
        ...inicial,
        id,
        fecha: fechaFinal,
        fechaCarga: fechaFinal,
        nroRemito: form.nroRemito,
        proveedor: proveedorFinal,
        observaciones: form.observaciones,
        tipo: form.tipo,
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        cantidad: Number(form.cantidad),
        unidad: form.unidad,
        foto: fotoFinal // Link limpio de Drive o vacío si hubo error de red
      });

      setSubiendo(false);
      onClose();
    } catch (err) {
      setSubiendo(false);
      console.error("Error crítico en handleGuardar:", err);
      setError("No se pudo estructurar el guardado del movimiento. Intentá nuevamente.");
    }
  };