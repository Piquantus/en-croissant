import { useRef, useState } from "react";
import { makeUci, Move } from "chessops";
import { commands } from "@/bindings";
import type { LocalEngine } from "@/utils/engines";
import BoardGame from "../BoardGame";

export default function CoachBoard() {
  console.log("CoachBoard mounted");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [engine, setEngine] = useState<LocalEngine | null>(null); // ← stocke l’engine sélectionné

  // Callback pour quand l’humain joue un coup
  async function onHumanMove(move: Move, fen: string, moves: string[]) {
    if (!engine) {
      console.warn("Aucun moteur sélectionné, impossible de lancer Stockfish");
      return;
    }

    const uciMove = makeUci(move);

    console.log("Human played UCI:", uciMove);
    console.log("FEN envoyée :", fen);
    console.log("Moves envoyés :", moves);

    const analysis = await commands.getBestMoves(
      "black",
      engine.path,
      "coach-analysis",
      { t: "Depth", c: 14 },
      {
        fen,
        moves: [],
        extraOptions: [],
      }
    );

    // ✅ Gestion correcte du Result
    if (analysis.status === "ok" && analysis.data) {
      const [score, bestMoves] = analysis.data;
      console.log("Best moves:", bestMoves, "Score:", score);

      if (score < -1.5) {
        setFeedback("❌ Mauvais coup — perte matérielle ou positionnelle");
      } else if (score < -0.5) {
        setFeedback("⚠️ Coup imprécis, il y avait mieux");
      } else {
        setFeedback("✅ Bon coup !");
      }
    } else if (analysis.status === "error") {
      console.error("Erreur Stockfish:", analysis.error);
      setFeedback(null); // pas de feedback si erreur
    }
  }

  // Callback pour récupérer l’engine sélectionné depuis BoardGame
  function handleEngineChange(engine: LocalEngine | null) {
    setEngine(engine);
    console.log("Engine sélectionné :", engine?.path);
  }

  return (
    <>
      <BoardGame
        mode="coach"
        onHumanMove={onHumanMove}
        onEngineChange={handleEngineChange} // ← remonte l’engine choisi
      />
      {feedback && <div style={{ padding: 8 }}>{feedback}</div>}
    </>
  );
}
