import { Observable } from '@reactivex/rxjs'

// set up the server


// register an Object


// push info into the Object

var myObj = Observable.interval(1000)
  .timeInterval();

myObj.subscribe((x:any) => {
  console.log("wow: ", x);
});
