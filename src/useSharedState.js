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
    (actualizador) => {
      return new Promise((resolve, reject) => {
        setEstado((previo) => {
          // Calcular el nuevo valor
          const valorFinal = typeof actualizador === "function" 
            ? actualizador(previo) 
            : actualizador;
          
          // Guardar en Firebase o localStorage de forma asincrónica
          const guardarDatos = async () => {
            if (firebaseConfigurado && db) {
              const referencia = ref(db, rtdbPath);
              try {
                await rtdbSet(referencia, valorFinal);
                console.debug(`✅ useSharedState: Guardado en Firebase (${rtdbPath})`);
                resolve(valorFinal);
              } catch (err) {
                console.error(`❌ Error guardando en Firebase (${rtdbPath}):`, err);
                reject(err);
              }
            } else {
              try {
                window.localStorage.setItem(rtdbPath, JSON.stringify(valorFinal));
                console.debug(`✅ useSharedState: Guardado en localStorage (${rtdbPath})`);
                resolve(valorFinal);
              } catch (err) {
                console.error(`❌ Error guardando en localStorage (${rtdbPath}):`, err);
                reject(err);
              }
            }
          };
          
          // Iniciar guardado sin bloquear React
          guardarDatos();
          
          // Retornar nuevo estado a React inmediatamente
          return valorFinal;
        });
      });
    },
    [rtdbPath]
  );

  return [estado, actualizar, listo];
}