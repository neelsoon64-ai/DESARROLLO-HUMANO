import { useState, useEffect, useCallback } from "react";
import { ref, onValue, set as rtdbSet } from "firebase/database";
import { db, firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// useSharedState — Sincroniza un valor con Realtime Database en TIEMPO REAL.
// Cualquier cambio que haga un dispositivo se ve al instante en todos los demás.
// Si Firebase no está configurado, persiste localmente en localStorage.
// ════════════════════════════════════════════════════════════════════════════
export function useSharedState(coleccion, idDocumento, valorInicial) {
  const [estado, setEstado] = useState(valorInicial);
  const [listo, setListo] = useState(false);
  const rtdbPath = `${coleccion}/${idDocumento}`;

  useEffect(() => {
    if (!firebaseConfigurado || !db) {
      try {
        const guardado = window.localStorage.getItem(rtdbPath);
        if (guardado) {
          setEstado(JSON.parse(guardado));
        }
      } catch (err) {
        console.warn("No se pudo cargar desde localStorage:", err);
      }
      setListo(true);
      return;
    }

    // Referencia al nodo exacto dentro del árbol JSON de Realtime Database
    const referencia = ref(db, rtdbPath);

    // onValue escucha cambios en tiempo real de forma nativa y eficiente
    const unsubscribe = onValue(
      referencia,
      (snap) => {
        if (snap.exists()) {
          setEstado(snap.val());
        } else {
          // Firebase descarta nodos vacíos. Si viene un objeto vacío {}, 
          // le seteamos una estructura mínima para forzar su creación en la BD.
          const valorAInicializar = 
            valorInicial && typeof valorInicial === "object" && Object.keys(valorInicial).length === 0
              ? { movimientos: [] }
              : valorInicial;

          rtdbSet(referencia, valorAInicializar).catch((err) =>
            console.error("Error al inicializar nodo en RTDB:", err)
          );
          setEstado(valorAInicializar);
        }
        setListo(true);
      },
      (error) => {
        console.error(`Error sincronizando en tiempo real ${rtdbPath}:`, error);
        setListo(true);
      }
    );

    return () => unsubscribe();
  }, [rtdbPath, valorInicial]);

  const actualizar = useCallback(
    async (actualizador) => {
      let valorFinal;
      
      // ✅ Paso 1: Actualizar estado local en React
      await new Promise(resolve => {
        setEstado((previo) => {
          // Calcular nuevo valor
          valorFinal = typeof actualizador === "function" 
            ? actualizador(previo) 
            : actualizador;
          
          // Resolver promise cuando se haya calculado (se ejecutará antes de que React re-render)
          resolve();
          
          // Retornar nuevo estado
          return valorFinal;
        });
      });
      
      // ✅ Paso 2: Guardar en Firebase/localStorage DESPUÉS de actualizar React
      if (firebaseConfigurado && db) {
        const referencia = ref(db, rtdbPath);
        try {
          await rtdbSet(referencia, valorFinal);
          console.debug(`✅ useSharedState: Guardado en Firebase (${rtdbPath}) - Total movimientos:`, 
            valorFinal.movimientos?.length || Object.keys(valorFinal.movimientos || {}).length);
        } catch (err) {
          console.error(`❌ Error guardando en Firebase (${rtdbPath}):`, err);
          throw err;
        }
      } else {
        try {
          window.localStorage.setItem(rtdbPath, JSON.stringify(valorFinal));
          console.debug(`✅ useSharedState: Guardado en localStorage (${rtdbPath})`);
        } catch (err) {
          console.error(`❌ Error guardando en localStorage (${rtdbPath}):`, err);
          throw err;
        }
      }
    },
    [rtdbPath]
  );

  return [estado, actualizar, listo];
}