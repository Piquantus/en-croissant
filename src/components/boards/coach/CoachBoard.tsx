import { useState, useRef } from "react";
import { Move } from "chessops";
import { makeUci } from "chessops/util";
import { type LocalEngine } from "@/utils/engines";
import BoardGame from "../BoardGame";
import { useAtomValue, useSetAtom } from "jotai";
import { coachFeedbackAtom } from "@/state/atoms";

export default function CoachBoard() {
  const [engine, setEngine] = useState<LocalEngine | null>(null);

  const setCoachFeedback = useSetAtom(coachFeedbackAtom);
  const feedback = useAtomValue(coachFeedbackAtom);

  // Stocker le dernier coup humain joué
  const lastHumanMoveRef = useRef<{
    fen: string;
    move: string;
    side: "white" | "black";
  } | null>(null);

  /** 
   * Quand l'humain joue un coup
   */
  function handleHumanMove(move: Move, fen: string, moves: string[]) {
    if (!engine) {
      console.warn("Aucun moteur sélectionné");
      return;
    }

    // Stocker le coup humain
    const side = moves.length % 2 === 1 ? "white" : "black";
    lastHumanMoveRef.current = {
      fen,
      move: makeUci(move),
      side,
    };

    // ⚡ Appeler Gemma directement pour générer un commentaire
    (async () => {
      try {
        // Ici on peut utiliser des valeurs mock si le moteur n'a pas encore évalué
        const cpBefore = 0;
        const cpAfter = 0;
        const classificationTag = "Pending"; // ou "Best" par défaut

        const gemmaFeedback = await fetchGemmaFeedback({
          fen,
          move: makeUci(move),
          side,
          bestAlternative: makeUci(move), // on met le même coup en attendant l'analyse
          cpBefore,
          cpAfter,
          classificationTag,
        });

        setCoachFeedback(gemmaFeedback);
      } catch (err) {
        console.error("Gemma feedback failed:", err);
        setCoachFeedback("❌ Impossible de générer le commentaire IA");
      }
    })();
  }


  /**
   * Quand le moteur a terminé son analyse
   */
  async function handleEngineAnalysis(payload: { bestMove: string; bestLine: string[] }) {
    if (!lastHumanMoveRef.current) return;

    const { fen, move, side } = lastHumanMoveRef.current;
    const [engineBestMove] = payload.bestLine;
    if (!engineBestMove) return;

    // ⚠️ À remplacer par l'évaluation réelle du moteur
    const cpBefore = 0;
    const cpAfter = move === engineBestMove ? 20 : -80;
    const cpDiff = cpAfter - cpBefore;

    // Classification simple selon la différence centipawn
    const classificationTag =
      cpDiff >= 0 ? "Best" :
      cpDiff >= -100 ? "Inaccuracy" :
      cpDiff >= -300 ? "Mistake" : "Blunder";

    const gemmaFeedback = await fetchGemmaFeedback({
      fen,
      move,
      side,
      bestAlternative: engineBestMove,
      cpBefore,
      cpAfter,
      classificationTag,
    });

    setCoachFeedback(gemmaFeedback);
    lastHumanMoveRef.current = null;
  }

  function handleEngineChange(selected: LocalEngine | null) {
    setEngine(selected);
  }

  /**
   * Envoi le coup au backend pour obtenir le feedback IA
   */
  async function fetchGemmaFeedback(payload: {
    fen: string;
    move: string;
    side: "white" | "black";
    bestAlternative: string;
    cpBefore: number;
    cpAfter: number;
    classificationTag: string;
  }): Promise<string> {
    try {
      const res = await fetch("http://127.0.0.1:8000/gemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: payload.fen,
          move: payload.move,
          side: payload.side,
          best_alt: payload.bestAlternative,
          cp_before: payload.cpBefore,
          cp_after: payload.cpAfter,
          tag: payload.classificationTag,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Gemma error:", text);
        throw new Error("Erreur serveur Gemma");
      }

      const data = await res.json();
      return data.feedback ?? "⚠️ Réponse IA vide";
    } catch (err) {
      console.error("Fetch Gemma failed:", err);
      return "❌ Impossible de récupérer le feedback IA";
    }
  }

  return (
    <div className="flex h-full w-full gap-4">
      {/* Plateau */}
      <div className="flex-1">
        <BoardGame
          mode="coach"
          onHumanMove={handleHumanMove}
          onEngineChange={handleEngineChange}
          onEngineAnalysis={handleEngineAnalysis}
        />
      </div>
    </div>
  );
}
