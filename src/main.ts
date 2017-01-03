import { Observable, Subject } from '@reactivex/rxjs';

// set up the server


// register an Object
var mySubject = new Subject();
var subscription = mySubject.subscribe(
  (x:any) => {
    console.log('Next: ' + x);
  },
  (err:any) => {
    console.log('Error: ' + err);
  },
  () => {
    console.log('Completed');
  });


// push info into the Object

mySubject.next('foo');

setInterval(() => {
  mySubject.next('foo');
}, 1000);