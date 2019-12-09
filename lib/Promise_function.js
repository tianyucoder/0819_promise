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
      if(self.status !== PENDING) return
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
      if(self.status !== PENDING) return
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
    //让错误的reason可以继续传递下去
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason}
    //让成功的value可以继续传递下去(当catch后还有then，如果写该行代码，Promise链就断掉了)
    onResolved = typeof onResolved === 'function' ? onResolved : value => value

    return new Promise((resolve,reject)=>{
      //负责执行onResolved或onrejected的回调函数
      function handle(callback) {
        try{
          let result = callback(self.data)
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
      }
      if(self.status === RESOLVED){
        //Promise实例状态为resolved，执行onResolved
        setTimeout(()=>{
          handle(onResolved)
        })
      }
      else if(self.status === REJECTED){
        //Promise实例状态为rejected，执行onRejected
        setTimeout(()=>{
          handle(onRejected)
        })
      }
      else{
        self.callbacks.push({
          onResolved:function () {
            handle(onResolved)
          },
          onRejected:function () {
            handle(onRejected)
          }
        })
      }
    })
  }

  //Promise原型对象上的catch方法，供实例使用，用于指定onRejected（注意：还要保证catch后的then依然能继续调用）
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined,onRejected)
  }

  //Promise自己身上的resolve，给自己用，用于快速返回一个状态为resolved的Promise实例，value
  Promise.resolve = function (value) {
    return new Promise((resolve,reject)=>{
      if(value instanceof Promise){
        value.then(
          val => resolve(val),
          reason => reject(reason)
        )
      }else{
        resolve(value)
      }
    })
  }

  //Promise自己身上的reject，给自己用，用于快速返回一个状态为rejected的Promise实例
  Promise.reject = function (reason) {
    return new Promise((resolve,reject)=>{
      reject(reason)
    })
  }

  //Promise自己身上的resolveDelay，给自己用，用于延迟返回一个状态为resolved的Promise实例，延迟时间自定义
  Promise.resolveDelay = function (value,time) {
    return new Promise((resolve,reject)=>{
      setTimeout(()=>{
        if(value instanceof Promise){
          value.then(
            val => resolve(val),
            reason => reject(reason)
          )
        }else{
          resolve(value)
        }
      },time)
    })
  }

  //Promise自己身上的rejectDelay，给自己用，用于快速返回一个状态为rejected的Promise实例，延迟时间自定义
  Promise.rejectDelay = function (reason,time) {
    return new Promise((resolve,reject)=>{
     setTimeout(()=>{
       reject(reason)
     },time)
    })
  }

  /*
  * Promise自己身上的all，给自己用，注意点：
  *   1.返回值是一个新的Promise实例
  *   2.接收一个数组，数组中的每一项都是一个Promise实例
  *   3.只有全部的Promise实例成功，才成功，值为所有成功的value组成的数组
  *   4.只要有一个失败，就失败，值为失败的那个Promise实例的reason
  * */
  Promise.all = function (promiseArr) {
    return new Promise((resolve,reject)=>{
      let resolvedCount = 0
      let values = []
      promiseArr.forEach((promise,index)=>{
        promise.then(
          value => {
            resolvedCount++
            values[index] = value
            if(resolvedCount === promiseArr.length){
              resolve(values)
            }
          },
          reason => reject(reason)
        )
      })
    })
  }

  /*
  * Promise自己身上的race，给自己用，注意点：
  *   1.返回值是一个新的Promise实例
  *   2.接收一个数组，数组中的每一项都是一个Promise实例
  *   3.返回的那个新的Promise实例的状态和数据，由最先有结果的那个Promise实例决定，
  * */
  Promise.race = function (promiseArr) {
    return new Promise((resolve,reject)=>{
      promiseArr.forEach((promise)=>{
        promise.then(
          value => resolve(value),
          reason => reject(reason)
        )
      })
    })
  }


  window.Promise = Promise
})()