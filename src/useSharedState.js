import { useState, useEffect, useCallback } from "react";
import { ref, onValue, set as rtdbSet } from "firebase/database";
import { db, firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// useSharedState — Sincroniza un valor con Realtime Database en TIEMPO REAL.
// Cualquier cambio que haga un dispositivo se ve al instante en todos los demás
// (PC, celular, tablet) gracias a onValue, sin necesidad de refrescar.
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
          // Si el nodo no existe en la base de datos, lo inicializamos
          rtdbSet(referencia, valorInicial).catch((err) =>
            console.error("Error al inicializar nodo en RTDB:", err)
          );
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
      setEstado((prev) => {
        const nuevo = typeof actualizador === "function" ? actualizador(prev) : actualizador;

        if (firebaseConfigurado && db) {
          const referencia = ref(db, rtdbPath);
          rtdbSet(referencia, nuevo).catch((err) =>
            console.error("Error guardando en Realtime Database:", err)
          );
        } else {
          try {
            window.localStorage.setItem(rtdbPath, JSON.stringify(nuevo));
          } catch (err) {
            console.warn("No se pudo guardar en localStorage:", err);
          }
        }

        return nuevo;
      });
    },
    [rtdbPath]
  );

  return [estado, actualizar, listo];
}