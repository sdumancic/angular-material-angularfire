import {Exercise} from './exercise.model';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {AngularFirestore} from 'angularfire2/firestore';
import {map} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {UIService} from '../shared/ui.service';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  constructor(private db: AngularFirestore,
              private uiService: UIService) {}

  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();
  private availableExercies: Exercise[] = [];
  private runningExercise: Exercise;
  private fbSubs: Subscription[] = [];

  fetchAvailableExercises() {
    this.uiService.loadingStateChanged.next(true);
    this.fbSubs.push(
      this.db.collection('availableExercises').snapshotChanges()
        .pipe(
           map( docArray => {
             return docArray.map(doc => {
               const data: any = doc.payload.doc.data();
               return {
                 id: doc.payload.doc.id,
                 ...data
               };
             });
           })
       ).subscribe( (exercises: Exercise[]) => {
         this.availableExercies = exercises;
         this.exercisesChanged.next([...this.availableExercies]);
         this.uiService.loadingStateChanged.next(false);
       }, error => {
         this.uiService.loadingStateChanged.next(false);
         this.uiService.showSnackbar('Fetching exercises failed, try again later',null,3000);
        this.exercisesChanged.next(null);
      })
    );
  }

  startExercise(selectedId: string) {
    /*
    this.db.doc('availableExercises/' + selectedId).update({
      lastSelected: new Date()
    });
     */

    const selectedExercise = this.availableExercies.find( ex => ex.id === selectedId);
    this.runningExercise = selectedExercise;
    this.exerciseChanged.next({...this.runningExercise});
  }

  completeExercise() {
    this.addDataToDatabase(
    {...this.runningExercise, date: new Date(), state: 'completed'})
    ;
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDatabase({...this.runningExercise, date: new Date(), state: 'cancelled',
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100)});
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  getRunningExercise() {
    return {...this.runningExercise};
  }

  fetchCompletedOrCancelledExercises() {
    this.fbSubs.push(
      this.db.collection('finishedExercises').valueChanges().subscribe( (exercises: Exercise[]) => {
        this.finishedExercisesChanged.next(exercises);
      })
    );
  }

  cancelSubscriptions() {
    this.fbSubs.forEach(s => s.unsubscribe());
  }

  private addDataToDatabase(exercise: Exercise) {
    this.db.collection('finishedExercises').add(exercise);
  }
}
