import { useState } from "react";
import { Move, makeUci } from "chessops";
import { type LocalEngine } from "@/utils/engines";
import BoardGame from "../BoardGame";
import { useSetAtom } from "jotai";
import { coachFeedbackAtom } from "@/state/atoms";

export default function CoachBoard() {
  const [engine, setEngine] = useState<LocalEngine | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [bestLine, setBestLine] = useState<string[]>([]);
  const setCoachFeedback = useSetAtom(coachFeedbackAtom);

  // Quand l’humain joue un coup
  async function handleHumanMove(move: Move, fen: string, moves: string[]) {
    if (!engine) {
      console.warn("Aucun moteur sélectionné, impossible de lancer Stockfish");
      return;
    }

    const uciMove = makeUci(move);
    console.log("Human played UCI:", uciMove);
    console.log("FEN:", fen);
    console.log("Moves so far:", moves);

    // Ici on pourrait directement appeler commands.getBestMoves
    // si besoin, mais on récupère maintenant via onEngineAnalysis
    setFeedback("Analyse en cours…");
  }

  // Quand Stockfish renvoie la meilleure ligne
  function handleEngineAnalysis(payload: {
    bestMove: string;
    bestLine: string[];
    fen: string;
    side: "white" | "black";
  }) {
    console.log("Best move received:", payload.bestMove);
    console.log("Best line:", payload.bestLine);

    const [engineBestMove, secondBest] = payload.bestLine;

    if (!engineBestMove) {
      setCoachFeedback("🤔 Analyse incomplète");
      return;
    }

    let feedback = "";

    if (payload.bestMove === engineBestMove) {
      feedback = "✅ Bon coup !";
    } else {
      feedback = `⚠️ Coup jouable, mais ${engineBestMove} était meilleur.`;
    }

    if (payload.bestLine.length > 1) {
      feedback += `\nPlan typique : ${payload.bestLine
        .slice(0, 4)
        .join(" → ")}`;
    }

    setCoachFeedback(feedback);
  }

  // Quand l’utilisateur change le moteur
  function handleEngineChange(selected: LocalEngine | null) {
    setEngine(selected);
    console.log("Engine sélectionné :", selected?.path);
  }

  return (
    <>
      <BoardGame
        mode="coach"
        onHumanMove={handleHumanMove}
        onEngineChange={handleEngineChange}
        onEngineAnalysis={handleEngineAnalysis}
      />
    </>
  );
}
