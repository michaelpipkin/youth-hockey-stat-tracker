import { inject, Injectable, signal } from '@angular/core';
import { Evaluation, EvaluationResult } from '@models/evaluation';
import { Player } from '@models/player';
import { EvaluationCategory } from '@shared/enums';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  Firestore,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  fs = inject(Firestore);

  programEvaluations = signal<Evaluation[]>([]);

  async processEvaluations(programId: string): Promise<any> {
    const batch = writeBatch(this.fs);
    const programRef = doc(this.fs, `programs/${programId}`);
    const playersQuery = query(
      collection(this.fs, 'players'),
      where('programRef', '==', programRef)
    );
    const players: Player[] = await getDocs(playersQuery).then((snapshot) => {
      return snapshot.docs.map((doc) => {
        return new Player({ id: doc.id, ...doc.data() });
      });
    });
    const evaluations: Evaluation[] = await getDocs(
      collection(this.fs, `programs/${programId}/evaluations`)
    ).then((snapshot) => {
      return snapshot.docs.map((doc) => {
        return new Evaluation({ id: doc.id, ...doc.data() });
      });
    });
    players.forEach((player) => {
      const playerEvaluations = evaluations.filter((evaluation) =>
        evaluation.scores.some(
          (score) => score.tryoutNumber === player.tryoutNumber
        )
      );
      let result = new EvaluationResult();
      playerEvaluations.forEach((evaluation) => {
        evaluation.scores
          .filter((score) => score.tryoutNumber === player.tryoutNumber)
          .forEach((score) => {
            result.totalScore +=
              score.category === EvaluationCategory.GP
                ? score.score * 1.5
                : score.score;
            result.totalLooks++;
          });
      });
      batch.update(doc(this.fs, `players/${player.id}`), {
        evaluationScore: result.averageScore,
        totalLooks: result.totalLooks,
      });
    });
    return await batch
      .commit()
      .then(() => {
        return true;
      })
      .catch((err: Error) => {
        throw new Error(err.message);
      });
  }

  async getEvaluations(programId: string): Promise<any> {
    const evals = collection(this.fs, `programs/${programId}/evaluations`);
    const evalQuery = query(
      evals,
      orderBy('evaluationDate', 'desc'),
      orderBy('evaluatorName', 'asc')
    );
    onSnapshot(evalQuery, (snapshot) => {
      this.programEvaluations.set(
        snapshot.docs.map(
          (doc) => new Evaluation({ id: doc.id, ...doc.data() })
        )
      );
    });
  }

  async addEvaluation(
    programId: string,
    evaluation: Partial<Evaluation>
  ): Promise<any> {
    const c = collection(this.fs, `programs/${programId}/evaluations`);
    return await addDoc(c, evaluation);
  }

  async updateEvaluation(
    programId: string,
    evaluationId: string,
    evaluation: Partial<Evaluation>
  ): Promise<any> {
    const evaluationDoc = doc(
      this.fs,
      `programs/${programId}/evaluations/${evaluationId}`
    );
    return await updateDoc(evaluationDoc, evaluation);
  }

  async deleteEvaluation(
    programId: string,
    evaluationId: string
  ): Promise<any> {
    return await deleteDoc(
      doc(this.fs, `programs/${programId}/evaluations/${evaluationId}`)
    );
  }
}
