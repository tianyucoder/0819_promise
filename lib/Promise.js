(function () {
  //定义常量
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  //Promise构造函数
  function Promise(excutor) { //接收一个执行器函数
    const self = this//缓存this
    self.status = PENDING //保存状态
    self.data = undefined//保存数据
    self.callbacks = [] //保存一组组的回调

    //resolve函数，用于：1.将pending状态改为resolved  2.保存成功的value 3.取出所有待执行的onResolved依次异步调用
    function resolve(value) {
      //1.将pending状态改为resolved
      self.status = RESOLVED
      //2.保存成功的value
      self.data = value
      //3.取出所有待执行的onResolved依次异步调用
      setTimeout(()=>{
        self.callbacks.forEach((cbkObj)=>{
          cbkObj.onResolved(value)
        })
      })
    }

    //reject函数，用于：1.将pending状态改为rejected 2.保存失败的reason
    function reject(reason) {
      //1.将pending状态改为resolved
      self.status = REJECTED
      //2.保存成功的value
      self.data = reason
      //3.取出所有待执行的onResolved依次调用
      setTimeout(()=>{
        self.callbacks.forEach((cbkObj)=>{
          cbkObj.onRejected(reason)
        })
      })
    }

    //调用执行器函数，注入resolve,reject，供Promise的使用者去调用
    excutor(resolve,reject)
  }

  /*
  * Promise原型对象上的then方法：
  *     一、then做什么？
  *         1.如果Promise实例状态为resolved，执行onResolved
  *         2.如果Promise实例状态为rejected，执行onRejected
  *         3.如果Promise实例状态为pending，保存onResolved、onRejected
  *
  *     二、then的返回值是什么？
  *         返回值是一个新的Promise实例，该实例的状态、数据如何确定--- 由onResolved或onRejected返回值决定
  *           1.如果onResolved或onRejected抛出异常，那么返回的那个新的Promise实例的状态为rejected，reason为抛出的异常。
  *           2.如果onResolved或onRejected返回的是非Promise类型，那么then返回的那个新的Promise实例的状态为resolved，value为返回值。
  *           3.如果onResolved或onRejected返回的是Promise类型，那么then返回的那个新的Promise实例的状态和数据与返回的是Promise类型
  * */
  Promise.prototype.then = function (onResolved,onRejected) {
    const self = this
    return new Promise((resolve,reject)=>{
      if(self.status === RESOLVED){
        //Promise实例状态为resolved，执行onResolved
        setTimeout(()=>{
          try{
            let result = onResolved(self.data)
            if(!(result instanceof Promise)){
              //onResolved返回的是非Promise类型，那么then返回的那个新的Promise实例的状态为resolved，value为返回值。
              resolve(result)
            }else{
              //onResolved返回的是Promise类型，那么then返回的那个新的Promise实例的状态和数据与返回的是Promise类型
              //完整写法：
              /*result.then(
                value => resolve(value)
                reason => reject(reason)
              )*/
              //简单写法
              result.then(resolve,reject)
            }
          }catch(err){
            //onResolved抛出异常，那么返回的那个新的Promise实例的状态为rejected，reason为抛出的异常。
            reject(err)
          }
        })
      }
      else if(self.status === REJECTED){
        //Promise实例状态为rejected，执行onRejected
        setTimeout(()=>{
          try{
            let result = onRejected(self.data)
            if(!(result instanceof Promise)){
              //onRejected返回的是非Promise类型，那么then返回的那个新的Promise实例的状态为reject，reason为返回值。
              resolve(result)
            }else{
              //onRejected返回的是Promise类型，那么then返回的那个新的Promise实例的状态和数据与返回的是Promise类型
              //完整写法：
              /*result.then(
                value => resolve(value)
                reason => reject(reason)
              )*/
              //简单写法
              result.then(resolve,reject)
            }
          }catch(err){
            //onRejected抛出异常，那么返回的那个新的Promise实例的状态为rejected，reason为抛出的异常。
            reject(err)
          }
        })
      }
      else{
        self.callbacks.push({
          onResolved,
          onRejected
        })
      }
    })
  }

  //Promise原型对象上的catch方法，供实例使用，用于指定onRejected
  Promise.prototype.catch = function (onRejected) {
    
  }

  //Promise自己身上的resolve，给自己用，用于快速返回一个状态为resolved的Promise实例
  Promise.resolve = function () {

  }

  //Promise自己身上的reject，给自己用，用于快速返回一个状态为rejected的Promise实例
  Promise.reject = function () {

  }

  /*
  * Promise自己身上的all，给自己用，注意点：
  *   1.返回值是一个新的Promise实例
  *   2.接收一个数组，数组中的每一项都是一个Promise实例
  *   3.只有全部的Promise实例成功，才成功，值为所有成功的value组成的数组
  *   4.只要有一个失败，就失败，值为失败的那个Promise实例的reason
  * */
  Promise.all = function () {

  }

  /*
  * Promise自己身上的race，给自己用，注意点：
  *   1.返回值是一个新的Promise实例
  *   2.接收一个数组，数组中的每一项都是一个Promise实例
  *   3.返回的那个新的Promise实例的状态和数据，由最先有结果的那个Promise实例决定，
  * */
  Promise.race = function () {

  }

  window.Promise = Promise
})()