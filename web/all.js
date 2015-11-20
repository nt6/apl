//usr/bin/env node "$0" $@;exit $?
function assert(x){if(!x)throw Error('assertion failed')}
function isInt(x,start,end){return x===~~x&&(start==null||start<=x&&(end==null||x<end))}
function prod(a){var r=1;for(var i=0;i<a.length;i++)r*=a[i];return r}
function all(a){for(var i=0;i<a.length;i++)if(!a[i])return;return 1}
function extend(x,y){for(var k in y)x[k]=y[k];return x}
function formatNumber(x){return(''+x).replace('Infinity','∞').replace(/-/g,'¯')}
function repeat(a,n){ // catenates "n" instances of a string or array "a"
  assert(a.length!=null)
  assert(isInt(n,0))
  if(!n)return a.slice(0,0)
  var m=n*a.length;while(a.length*2<m)a=a.concat(a)
  return a.concat(a.slice(0,m-a.length))
}
this.Uint8Array =this.Uint8Array ||Array
this.Uint16Array=this.Uint16Array||Array
this.Uint32Array=this.Uint32Array||Array
this.Int8Array  =this.Int8Array  ||Array
this.Int16Array =this.Int16Array ||Array
this.Int32Array =this.Int32Array ||Array
Array.prototype.set=Array.prototype.set||function(a,i0){for(var i=0;i<a.length;i++)this[i0+i]=a[i]}
function spread(a,i,m,n){ // repeat the pattern a[i...i+m] so it covers a[i...i+n]
  if(a instanceof Array){for(var j=m;j<n;j++)a[i+j]=a[i+j%m]}
  else{a=a.subarray(i,i+n);while(2*m<n){a.set(a.subarray(0,m),m);m*=2};a.set(a.subarray(0,n-m),m)}
}
function arrayEquals(x,y){
  assert(x.length!=null)
  assert(y.length!=null)
  if(x.length!==y.length)return 0
  for(var i=0;i<x.length;i++)if(x[i]!==y[i])return 0
  return 1
}
function reversed(a){
  if(a instanceof Array)return a.slice(0).reverse()
  var i=-1,j=a.length,b=new a.constructor(a.length);b.set(a)
  while(++i<--j){var h=b[i];b[i]=b[j];b[j]=h}
  return b
}
String.prototype.includes=String.prototype.includes||function(){
  'use strict';return String.prototype.indexOf.apply(this,arguments)!==-1
}
function aplError(name,m,o){ // m:message, o:options
  m=m||''
  if(o&&o.aplCode&&o.offset!=null){
    var a=o.aplCode.slice(0,o.offset).split('\n')
    var l=a.length,c=1+(a[a.length-1]||'').length // line and column
    m+='\n'+(o.file||'-')+':'+l+':'+c+o.aplCode.split('\n')[l-1]+'_'.repeat(c-1)+'^'
  }
  var e=Error(m);e.name=name;for(var k in o)e[k]=o[k]
  throw e
}
function syntaxError(m,o){aplError('SYNTAX ERROR',m,o)}
function domainError(m,o){aplError('DOMAIN ERROR',m,o)}
function lengthError(m,o){aplError('LENGTH ERROR',m,o)}
function   rankError(m,o){aplError(  'RANK ERROR',m,o)}
function  indexError(m,o){aplError( 'INDEX ERROR',m,o)}
function  nonceError(m,o){aplError( 'NONCE ERROR',m,o)}
function  valueError(m,o){aplError( 'VALUE ERROR',m,o)}
function each(a,f){ // iterates through the elements of an APL array in ravel order.
  if(a.empty())return
  var data=a.data,shape=a.shape,stride=a.stride,lastAxis=shape.length-1,p=a.offset,i=[],axis=shape.length
  while(--axis>=0)i.push(0)
  while(1){
    f(data[p],i,p)
    axis=lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){
      p-=i[axis]*stride[axis];i[axis--]=0
    }
    if(axis<0)break
    i[axis]++
    p+=stride[axis]
  }
}
function each2(a,b,f){ // like each() but iterates over two APL array in parallel
  var data =a.data,shape =a.shape,stride =a.stride
  var data1=b.data,shape1=b.shape,stride1=b.stride
  shape.length!==shape1.length&&rankError()
  shape!=''+shape1&&lengthError() // abuse JS type coercion -- compare the shapes as strings
  if(a.empty())return
  var lastAxis=shape.length-1,p=a.offset,q=b.offset
  var i=Array(shape.length);for(var j=0;j<i.length;j++)i[j]=0
  while(1){
    f(data[p],data1[q],i)
    var axis = lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){p-=i[axis]*stride[axis];q-=i[axis]*stride1[axis];i[axis--]=0}
    if(axis<0)break
    i[axis]++;p+=stride[axis];q+=stride1[axis]
  }
}

function A(data,shape,stride,offset){ // APL array constructor
  this.data=data
  this.shape=shape||[this.data.length]
  this.stride=stride||strideForShape(this.shape)
  this.offset=offset||0
  assert(this.data.length!=null)
  assert(this.shape.length!=null)
  assert(this.stride.length!=null)
  assert(!this.data.length||isInt(this.offset,0,this.data.length))
  assert(this.stride.length===this.shape.length)
  for(var i=0;i<this.shape.length;i++)assert(isInt(this.shape[i],0))
  if(this.data.length)for(var i=0;i<this.stride.length;i++)assert(isInt(this.stride[i],-this.data.length,this.data.length+1))
}
extend(A.prototype,{
  empty: function(){var shape=this.shape;for(var i=0;i<shape.length;i++)if(!shape[i])return 1;return 0},
  map:function(f){var r=[];each(this,function(x,i,p){r.push(f(x,i,p))});return new A(r,this.shape)},
  map2:function(a,f){var r=[];each2(this,a,function(x,y,i){r.push(f(x,y,i))});return new A(r,this.shape)},
  toArray:function(){var r=[];each(this,function(x){r.push(x)});return r},
  toInt:function(m,M){var r=this.unwrap();if(r!==r|0||m!=null&&r<m||M!=null&&M<=r)domainError();return r},
  toBool:function(){return this.toInt(0,2)},
  toSimpleString:function(){
    if(this.shape.length>1)rankError()
    if(typeof this.data==='string'){
      if(!this.shape.length)return this.data[this.offset]
      if(!this.shape[0])return''
      if(this.stride[0]===1)return this.data.slice(this.offset,this.offset+this.shape[0])
      return this.toArray().join('')
    }else{
      var a=this.toArray()
      for(var i=0;i<a.length;i++)typeof a[i]!=='string'&&domainError()
      return a.join('')
    }
  },
  isSingleton:function(){var s=this.shape;for(var i=0;i<s.length;i++)if(s[i]!==1)return 0;return 1},
  isSimple:function(){return!this.shape.length&&!(this.data[this.offset]instanceof A)},
  unwrap:function(){this.isSingleton()||lengthError();return this.data[this.offset]},
  getPrototype:function(){return this.empty()||typeof this.data[this.offset]!=='string'?0:' '}, // todo
  toString:function(){return format(this).join('\n')},
  repr:function(){return'new A('+repr(this.data)+','+repr(this.shape)+','+repr(this.stride)+','+repr(this.offset)+')'}
})
function strideForShape(shape){
  assert(shape.length!=null)
  if(!shape.length)return[]
  var r=Array(shape.length)
  r[r.length-1]=1
  for(var i=r.length-2;i>=0;i--){
    assert(isInt(shape[i],0))
    r[i]=r[i+1]*shape[i+1]
  }
  return r
}
A.zero =new A([0],[])
A.one  =new A([1],[])
A.zilde=new A([],[0])
A.scalar=function(x){return new A([x],[])}
A.bool=[A.zero,A.one]
var prelude={"code":[1,new A([],[0],[1],0),4,0,73,9,1,new A("ABCDEFGHIJKLMNOPQRSTUVWXYZ",[26],[1],0),4,0,84,9,1,new A("ÁÂÃÇÈÊËÌÍÎÏÐÒÓÔÕÙÚÛÝþãìðòõ",[26],[1],0),4,0,85,9,7,22,3,1,2,3,0,65,3,1,0,3,0,29,3,1,2,6,3,0,44,5,6,8,3,0,72,3,0,44,6,4,0,44,9,7,36,7,15,3,2,0,3,1,0,3,2,2,6,3,1,2,5,8,3,0,72,7,12,3,2,0,3,1,0,5,3,1,2,5,8,6,8,4,0,74,9,7,173,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,4,1,4,9,3,1,2,7,123,3,2,0,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,2,0,3,0,13,5,4,2,0,9,3,1,4,3,0,62,5,3,0,62,5,3,0,15,3,2,0,3,0,62,5,6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,4,3,0,62,5,3,0,19,3,2,0,6,3,0,45,3,0,65,5,5,11,8,9,1,new A("INDEX ERROR",[11],[1],0),3,0,61,5,8,9,3,1,4,3,0,67,3,2,0,6,3,0,75,5,4,1,4,8,3,0,27,5,5,9,3,1,4,8,3,0,72,7,229,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,9,9,3,1,0,3,0,70,5,8,9,3,1,0,3,0,62,5,3,0,3,3,0,65,5,5,3,0,14,1,new A([0],[],[],0),6,11,5,9,3,1,0,8,9,3,1,0,3,0,62,5,4,1,4,9,3,1,0,3,0,13,5,4,1,0,9,3,1,0,3,0,62,3,0,27,5,5,4,1,5,3,0,79,3,0,27,5,5,3,0,35,3,0,65,5,5,4,1,6,9,3,1,5,3,0,13,3,0,21,1,new A([1],[],[],0),3,0,62,3,1,6,6,6,3,0,36,3,0,26,6,3,0,37,3,0,62,6,3,0,27,5,5,4,1,5,3,0,35,3,0,65,5,5,3,0,70,5,4,1,7,9,3,1,0,7,18,3,2,0,3,0,62,3,2,2,6,3,0,70,3,1,7,6,8,3,0,27,5,3,1,5,6,3,0,76,3,0,65,5,5,3,0,70,5,3,0,62,3,1,7,3,0,13,3,1,4,6,6,8,6,4,0,75,9,7,335,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,15,1,new A([1],[],[],0),6,11,8,9,1,new A("NONCE ERROR",[11],[1],0),3,0,61,5,8,9,1,new A([0],[],[],0),3,0,14,3,1,2,6,3,0,13,5,4,1,2,9,3,1,2,3,0,33,1,new A([1,1],[2],[1],0),6,3,0,44,5,4,1,4,9,3,1,2,3,0,65,3,1,4,6,4,1,5,9,3,1,0,3,0,65,3,1,4,6,4,1,6,9,3,0,73,7,52,3,1,5,3,0,70,1,new A([1],[],[],0),6,3,0,14,1,new A([1],[],[],0),6,11,34,9,3,0,73,7,26,3,1,5,3,0,26,1,new A([1],[],[],0),6,4,1,5,9,3,1,6,3,0,26,1,new A([1],[],[],0),6,4,1,6,8,5,8,8,5,9,3,0,73,7,52,3,1,5,3,0,70,1,new A([-1],[],[],0),6,3,0,14,1,new A([1],[],[],0),6,11,34,9,3,0,73,7,26,3,1,5,3,0,26,1,new A([-1],[],[],0),6,4,1,5,9,3,1,6,3,0,26,1,new A([-1],[],[],0),6,4,1,6,8,5,8,8,5,9,3,1,5,3,0,62,5,3,0,42,5,3,0,65,3,1,5,6,3,0,13,3,0,81,5,3,1,5,3,0,62,5,6,4,1,5,9,1,new A([0],[],[],0),4,1,7,9,3,1,6,3,0,43,5,7,38,3,2,0,3,0,70,3,2,2,6,3,0,26,3,1,7,6,4,2,4,9,1,new A([1],[],[],0),3,0,0,3,2,2,6,4,1,7,9,3,2,4,8,3,0,27,5,3,1,5,6,8,3,0,72,3,0,43,6,4,0,43,9,7,235,3,1,2,3,0,62,5,3,0,62,5,3,0,16,1,new A([1],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,2,3,0,13,5,4,1,4,9,3,1,0,7,46,3,2,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,22,9,3,2,0,3,0,62,1,new A([1],[],[],0),3,0,62,3,1,4,3,0,62,5,6,6,8,9,3,2,0,8,5,4,1,0,9,3,1,0,3,0,62,5,3,0,62,5,3,0,17,3,1,4,3,0,62,5,6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,4,3,0,70,3,1,0,3,0,62,5,3,0,62,5,6,4,1,4,9,3,1,0,3,0,62,5,3,0,0,3,1,4,6,3,0,35,1,new A([0],[],[],0),6,3,0,3,1,new A([0],[],[],0),3,0,18,3,1,4,6,6,3,0,0,3,1,0,3,0,62,5,3,0,1,3,1,4,6,3,0,34,1,new A([0],[],[],0),6,3,0,3,1,new A([0],[],[],0),3,0,17,3,1,4,6,6,6,4,1,4,9,3,1,0,3,0,70,3,1,4,6,8,3,0,72,7,60,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,5,9,3,1,0,8,9,3,1,0,3,1,0,3,0,62,5,3,0,62,5,3,0,0,1,new A([-1],[],[],0),6,2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,0,43,6,5,8,6,4,0,26,9,7,23,3,1,0,1,new A([0],[],[],0),2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,0,13,6,3,1,2,6,8,3,0,72,7,38,3,1,0,3,0,62,3,1,0,3,0,79,5,3,1,0,3,0,62,5,3,0,26,1,new A([1],[],[],0),6,3,0,3,3,0,65,5,5,2,2,6,8,6,4,0,76,9,7,4,3,1,0,8,4,0,77,9,7,4,3,1,2,8,3,0,72,7,4,3,1,0,8,6,4,0,78,9,7,15,3,1,0,3,0,20,3,1,2,6,3,0,44,5,8,3,0,72,7,21,1,new A([1],[],[],0),3,0,13,3,1,0,3,0,62,5,6,3,0,62,3,0,73,6,8,6,4,0,79,9,3,0,13,3,0,72,7,23,3,1,0,3,0,62,3,1,0,3,0,62,5,3,0,3,3,0,65,5,5,6,8,6,4,0,13,9,7,22,3,1,2,3,0,3,3,0,25,3,0,0,6,3,1,0,3,0,80,5,6,8,3,0,72,7,724,7,28,1,new A([0.5],[],[],0),3,0,5,3,2,0,3,0,0,5,3,0,3,3,0,25,3,0,0,6,3,2,0,6,6,8,4,1,4,9,7,290,1,new A([1],[],[],0),2,1,1,new A([0],[1],[1],0),2,2,3,0,68,3,2,0,3,0,62,5,6,4,2,4,9,3,2,4,3,0,19,1,new A([1],[],[],0),6,11,43,9,3,2,0,7,35,3,3,0,3,0,13,5,3,1,4,5,4,3,4,9,3,3,4,3,0,4,3,3,0,6,3,3,4,3,0,76,5,2,2,8,5,8,9,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,35,5,4,2,5,9,3,2,0,3,0,70,3,2,5,3,0,13,3,2,0,3,0,62,5,3,0,70,1,new A([1],[],[],0),6,6,6,4,2,6,9,3,2,0,3,0,26,3,2,5,3,0,13,1,new A([0],[],[],0),6,6,4,2,7,9,3,2,6,3,2,1,5,10,2,4,2,8,9,4,2,9,9,9,3,2,7,3,0,3,3,0,25,3,0,0,6,3,2,8,3,0,71,5,3,0,0,5,6,4,2,10,9,3,2,10,3,0,3,3,0,25,3,0,0,6,3,2,8,6,3,0,1,3,2,7,6,3,2,1,5,10,2,4,2,11,9,4,2,12,9,9,3,2,11,3,0,13,3,2,8,6,3,2,12,3,0,70,3,2,4,3,0,1,5,3,0,13,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,34,5,6,6,3,0,76,3,2,10,3,0,13,3,2,9,6,6,2,2,8,4,1,5,9,7,214,3,2,0,3,0,62,5,3,0,70,1,new A([1],[],[],0),6,4,2,4,3,0,14,1,new A([1],[],[],0),6,11,9,9,3,2,0,3,0,4,5,8,9,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,35,5,4,2,5,9,3,2,0,3,0,70,3,2,5,3,0,13,3,2,5,6,6,3,2,1,5,4,2,6,9,3,2,0,3,0,26,3,2,5,3,0,13,3,2,5,6,6,3,2,1,5,4,2,7,9,3,2,0,3,0,70,3,2,4,3,0,1,3,2,5,6,3,0,13,3,2,5,6,6,4,2,8,9,3,2,7,3,0,3,3,0,25,3,0,0,6,3,2,8,6,3,0,3,3,0,25,3,0,0,6,3,2,6,6,3,0,1,5,4,2,9,9,3,2,7,3,0,70,3,2,4,3,0,1,5,3,0,13,1,new A([2],[],[],0),3,0,4,3,2,4,6,3,0,34,5,6,6,3,0,76,3,2,9,3,0,13,3,2,6,6,6,8,4,1,6,9,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([0],[],[],0),6,11,9,9,3,1,0,3,0,4,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,14,1,new A([1],[],[],0),6,11,17,9,3,1,0,3,0,76,5,3,1,1,5,3,0,13,5,8,9,3,1,0,3,0,62,5,3,0,62,5,3,0,15,1,new A([2],[],[],0),6,11,8,9,1,new A("RANK ERROR",[10],[1],0),3,0,61,5,8,9,3,1,0,3,0,62,5,3,0,19,3,0,65,5,5,3,0,29,1,new A([0],[],[],0),6,11,8,9,1,new A("LENGTH ERROR",[12],[1],0),3,0,61,5,8,9,3,1,0,3,1,5,5,10,2,4,1,7,9,4,1,8,9,9,3,1,7,3,0,71,5,3,0,0,5,3,0,3,3,0,25,3,0,0,6,3,1,8,3,1,6,5,6,8,6,4,0,80,9,7,31,7,11,3,2,2,3,1,0,3,2,0,6,8,3,0,72,7,11,3,2,0,3,1,0,3,2,0,6,8,6,8,4,0,81,9,3,0,1,4,0,2,9,3,0,5,4,0,6,9,3,0,8,4,0,9,9,3,0,46,4,0,47,9,3,0,29,4,0,30,8],"nSlots":86,"vars":{"get_⎕OFF":{"category":2,"slot":83,"scopeDepth":0},"⎕OFF":{"category":1},"⎕A":{"scopeDepth":0,"slot":84,"category":1},"⎕Á":{"scopeDepth":0,"slot":85,"category":1},"⎕a":{"scopeDepth":0,"slot":82,"category":1},"+":{"category":2,"slot":0,"scopeDepth":0},"-":{"category":2,"slot":1,"scopeDepth":0},"−":{"category":2,"slot":2,"scopeDepth":0},"×":{"category":2,"slot":3,"scopeDepth":0},"÷":{"category":2,"slot":4,"scopeDepth":0},"*":{"category":2,"slot":5,"scopeDepth":0},"⋆":{"category":2,"slot":6,"scopeDepth":0},"⍟":{"category":2,"slot":7,"scopeDepth":0},"|":{"category":2,"slot":8,"scopeDepth":0},"∣":{"category":2,"slot":9,"scopeDepth":0},"\\":{"category":3,"slot":10,"scopeDepth":0},"⍀":{"category":3,"slot":11,"scopeDepth":0},"○":{"category":2,"slot":12,"scopeDepth":0},",":{"category":2,"slot":13,"scopeDepth":0},"=":{"category":2,"slot":14,"scopeDepth":0},"≠":{"category":2,"slot":15,"scopeDepth":0},"<":{"category":2,"slot":16,"scopeDepth":0},">":{"category":2,"slot":17,"scopeDepth":0},"≤":{"category":2,"slot":18,"scopeDepth":0},"≥":{"category":2,"slot":19,"scopeDepth":0},"≡":{"category":2,"slot":20,"scopeDepth":0},"∘":{"category":4,"slot":21,"scopeDepth":0},"∪":{"category":2,"slot":22,"scopeDepth":0},"∩":{"category":2,"slot":23,"scopeDepth":0},"⊥":{"category":2,"slot":24,"scopeDepth":0},".":{"category":4,"slot":25,"scopeDepth":0},"↓":{"category":2,"slot":26,"scopeDepth":0},"¨":{"category":3,"slot":27,"scopeDepth":0},"⊤":{"category":2,"slot":28,"scopeDepth":0},"∊":{"category":2,"slot":29,"scopeDepth":0},"∈":{"category":2,"slot":30,"scopeDepth":0},"!":{"category":2,"slot":31,"scopeDepth":0},"⍎":{"category":2,"slot":32,"scopeDepth":0},"⍷":{"category":2,"slot":33,"scopeDepth":0},"⌊":{"category":2,"slot":34,"scopeDepth":0},"⌈":{"category":2,"slot":35,"scopeDepth":0},"_fork1":{"category":2,"slot":36,"scopeDepth":0},"_fork2":{"category":2,"slot":37,"scopeDepth":0},"⍕":{"category":2,"slot":38,"scopeDepth":0},"⍋":{"category":2,"slot":39,"scopeDepth":0},"⍒":{"category":2,"slot":40,"scopeDepth":0},"⍁":{"category":4,"slot":41,"scopeDepth":0},"⍳":{"category":2,"slot":42,"scopeDepth":0},"⊂":{"category":2,"slot":43,"scopeDepth":0},"~":{"category":2,"slot":44,"scopeDepth":0},"∨":{"category":2,"slot":45,"scopeDepth":0},"∧":{"category":2,"slot":46,"scopeDepth":0},"^":{"category":2,"slot":47,"scopeDepth":0},"⍱":{"category":2,"slot":48,"scopeDepth":0},"⍲":{"category":2,"slot":49,"scopeDepth":0},"⍣":{"category":4,"slot":50,"scopeDepth":0},"get_⎕":{"category":2,"slot":51,"scopeDepth":0},"⎕":{"category":1},"set_⎕":{"category":2,"slot":52,"scopeDepth":0},"get_⍞":{"category":2,"slot":53,"scopeDepth":0},"⍞":{"category":1},"set_⍞":{"category":2,"slot":54,"scopeDepth":0},"get_⎕IO":{"category":2,"slot":55,"scopeDepth":0},"⎕IO":{"category":1},"set_⎕IO":{"category":2,"slot":56,"scopeDepth":0},"⎕DL":{"category":2,"slot":57,"scopeDepth":0},"⎕RE":{"category":2,"slot":58,"scopeDepth":0},"⎕UCS":{"category":2,"slot":59,"scopeDepth":0},"?":{"category":2,"slot":60,"scopeDepth":0},"↗":{"category":2,"slot":61,"scopeDepth":0},"⍴":{"category":2,"slot":62,"scopeDepth":0},"⌽":{"category":2,"slot":63,"scopeDepth":0},"⊖":{"category":2,"slot":64,"scopeDepth":0},"/":{"category":3,"slot":65,"scopeDepth":0},"⌿":{"category":3,"slot":66,"scopeDepth":0},"⌷":{"category":2,"slot":67,"scopeDepth":0},"_index":{"category":2,"slot":68,"scopeDepth":0},"_substitute":{"category":2,"slot":69,"scopeDepth":0},"↑":{"category":2,"slot":70,"scopeDepth":0},"⍉":{"category":2,"slot":71,"scopeDepth":0},"⍠":{"category":4,"slot":72,"scopeDepth":0},"⍬":{"scopeDepth":0,"slot":73,"category":1},"_atop":{"scopeDepth":0,"slot":74,"category":4},"⊃":{"scopeDepth":0,"slot":75,"category":2},"⍪":{"scopeDepth":0,"slot":76,"category":2},"⊢":{"scopeDepth":0,"slot":77,"category":2},"⊣":{"scopeDepth":0,"slot":78,"category":2},"≢":{"scopeDepth":0,"slot":79,"category":2},"⌹":{"scopeDepth":0,"slot":80,"category":2},"⍨":{"scopeDepth":0,"slot":81,"category":3}}};
function assert(x){if(!x)throw Error('assertion failed')}
function isInt(x,start,end){return x===~~x&&(start==null||start<=x&&(end==null||x<end))}
function prod(a){var r=1;for(var i=0;i<a.length;i++)r*=a[i];return r}
function all(a){for(var i=0;i<a.length;i++)if(!a[i])return;return 1}
function extend(x,y){for(var k in y)x[k]=y[k];return x}
function formatNumber(x){return(''+x).replace('Infinity','∞').replace(/-/g,'¯')}
function repeat(a,n){ // catenates "n" instances of a string or array "a"
  assert(a.length!=null)
  assert(isInt(n,0))
  if(!n)return a.slice(0,0)
  var m=n*a.length;while(a.length*2<m)a=a.concat(a)
  return a.concat(a.slice(0,m-a.length))
}
this.Uint8Array =this.Uint8Array ||Array
this.Uint16Array=this.Uint16Array||Array
this.Uint32Array=this.Uint32Array||Array
this.Int8Array  =this.Int8Array  ||Array
this.Int16Array =this.Int16Array ||Array
this.Int32Array =this.Int32Array ||Array
Array.prototype.set=Array.prototype.set||function(a,i0){for(var i=0;i<a.length;i++)this[i0+i]=a[i]}
function spread(a,i,m,n){ // repeat the pattern a[i...i+m] so it covers a[i...i+n]
  if(a instanceof Array){for(var j=m;j<n;j++)a[i+j]=a[i+j%m]}
  else{a=a.subarray(i,i+n);while(2*m<n){a.set(a.subarray(0,m),m);m*=2};a.set(a.subarray(0,n-m),m)}
}
function arrayEquals(x,y){
  assert(x.length!=null)
  assert(y.length!=null)
  if(x.length!==y.length)return 0
  for(var i=0;i<x.length;i++)if(x[i]!==y[i])return 0
  return 1
}
function reversed(a){
  if(a instanceof Array)return a.slice(0).reverse()
  var i=-1,j=a.length,b=new a.constructor(a.length);b.set(a)
  while(++i<--j){var h=b[i];b[i]=b[j];b[j]=h}
  return b
}
String.prototype.includes=String.prototype.includes||function(){
  'use strict';return String.prototype.indexOf.apply(this,arguments)!==-1
}
function aplError(name,m,o){ // m:message, o:options
  m=m||''
  if(o&&o.aplCode&&o.offset!=null){
    var a=o.aplCode.slice(0,o.offset).split('\n')
    var l=a.length,c=1+(a[a.length-1]||'').length // line and column
    m+='\n'+(o.file||'-')+':'+l+':'+c+o.aplCode.split('\n')[l-1]+'_'.repeat(c-1)+'^'
  }
  var e=Error(m);e.name=name;for(var k in o)e[k]=o[k]
  throw e
}
function syntaxError(m,o){aplError('SYNTAX ERROR',m,o)}
function domainError(m,o){aplError('DOMAIN ERROR',m,o)}
function lengthError(m,o){aplError('LENGTH ERROR',m,o)}
function   rankError(m,o){aplError(  'RANK ERROR',m,o)}
function  indexError(m,o){aplError( 'INDEX ERROR',m,o)}
function  nonceError(m,o){aplError( 'NONCE ERROR',m,o)}
function  valueError(m,o){aplError( 'VALUE ERROR',m,o)}
function each(a,f){ // iterates through the elements of an APL array in ravel order.
  if(a.empty())return
  var data=a.data,shape=a.shape,stride=a.stride,lastAxis=shape.length-1,p=a.offset,i=[],axis=shape.length
  while(--axis>=0)i.push(0)
  while(1){
    f(data[p],i,p)
    axis=lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){
      p-=i[axis]*stride[axis];i[axis--]=0
    }
    if(axis<0)break
    i[axis]++
    p+=stride[axis]
  }
}
function each2(a,b,f){ // like each() but iterates over two APL array in parallel
  var data =a.data,shape =a.shape,stride =a.stride
  var data1=b.data,shape1=b.shape,stride1=b.stride
  shape.length!==shape1.length&&rankError()
  shape!=''+shape1&&lengthError() // abuse JS type coercion -- compare the shapes as strings
  if(a.empty())return
  var lastAxis=shape.length-1,p=a.offset,q=b.offset
  var i=Array(shape.length);for(var j=0;j<i.length;j++)i[j]=0
  while(1){
    f(data[p],data1[q],i)
    var axis = lastAxis
    while(axis>=0&&i[axis]+1===shape[axis]){p-=i[axis]*stride[axis];q-=i[axis]*stride1[axis];i[axis--]=0}
    if(axis<0)break
    i[axis]++;p+=stride[axis];q+=stride1[axis]
  }
}

function A(data,shape,stride,offset){ // APL array constructor
  this.data=data
  this.shape=shape||[this.data.length]
  this.stride=stride||strideForShape(this.shape)
  this.offset=offset||0
  assert(this.data.length!=null)
  assert(this.shape.length!=null)
  assert(this.stride.length!=null)
  assert(!this.data.length||isInt(this.offset,0,this.data.length))
  assert(this.stride.length===this.shape.length)
  for(var i=0;i<this.shape.length;i++)assert(isInt(this.shape[i],0))
  if(this.data.length)for(var i=0;i<this.stride.length;i++)assert(isInt(this.stride[i],-this.data.length,this.data.length+1))
}
extend(A.prototype,{
  empty: function(){var shape=this.shape;for(var i=0;i<shape.length;i++)if(!shape[i])return 1;return 0},
  map:function(f){var r=[];each(this,function(x,i,p){r.push(f(x,i,p))});return new A(r,this.shape)},
  map2:function(a,f){var r=[];each2(this,a,function(x,y,i){r.push(f(x,y,i))});return new A(r,this.shape)},
  toArray:function(){var r=[];each(this,function(x){r.push(x)});return r},
  toInt:function(m,M){var r=this.unwrap();if(r!==r|0||m!=null&&r<m||M!=null&&M<=r)domainError();return r},
  toBool:function(){return this.toInt(0,2)},
  toSimpleString:function(){
    if(this.shape.length>1)rankError()
    if(typeof this.data==='string'){
      if(!this.shape.length)return this.data[this.offset]
      if(!this.shape[0])return''
      if(this.stride[0]===1)return this.data.slice(this.offset,this.offset+this.shape[0])
      return this.toArray().join('')
    }else{
      var a=this.toArray()
      for(var i=0;i<a.length;i++)typeof a[i]!=='string'&&domainError()
      return a.join('')
    }
  },
  isSingleton:function(){var s=this.shape;for(var i=0;i<s.length;i++)if(s[i]!==1)return 0;return 1},
  isSimple:function(){return!this.shape.length&&!(this.data[this.offset]instanceof A)},
  unwrap:function(){this.isSingleton()||lengthError();return this.data[this.offset]},
  getPrototype:function(){return this.empty()||typeof this.data[this.offset]!=='string'?0:' '}, // todo
  toString:function(){return format(this).join('\n')},
  repr:function(){return'new A('+repr(this.data)+','+repr(this.shape)+','+repr(this.stride)+','+repr(this.offset)+')'}
})
function strideForShape(shape){
  assert(shape.length!=null)
  if(!shape.length)return[]
  var r=Array(shape.length)
  r[r.length-1]=1
  for(var i=r.length-2;i>=0;i--){
    assert(isInt(shape[i],0))
    r[i]=r[i+1]*shape[i+1]
  }
  return r
}
A.zero =new A([0],[])
A.one  =new A([1],[])
A.zilde=new A([],[0])
A.scalar=function(x){return new A([x],[])}
A.bool=[A.zero,A.one]
// complexify(x)
// * if x is real, it's converted to a complex instance with imaginary part 0
// * if x is already complex, it's preserved
function complexify(x){return typeof x==='number'?new Z(x,0):x instanceof Z?x:domainError()}

// simplify(re, im)
// * if the imaginary part is 0, the real part is returned
// * otherwise, a complex instance is created
function simplify(re,im){return im===0?re:new Z(re,im)}

function Z(re,im){ // complex number constructor
  assert(typeof re==='number')
  assert(typeof im==='number'||im==null)
  if(re!==re||im!==im)domainError('NaN')
  this.re=re;this.im=im||0
}
Z.prototype.toString=function(){return formatNumber(this.re)+'J'+formatNumber(this.im)}
Z.prototype.repr=function(){return'new Z('+repr(this.re)+','+repr(this.im)+')'}

Z.exp=function(x){x=complexify(x);var r=Math.exp(x.re);return simplify(r*Math.cos(x.im),r*Math.sin(x.im))}
Z.log=function(x){
  if(typeof x==='number'&&x>0){return Math.log(x)}
  else{x=complexify(x);return simplify(Math.log(Math.sqrt(x.re*x.re+x.im*x.im)),Z.direction(x))}
}
Z.conjugate=function(x){return new Z(x.re,-x.im)}
Z.negate   =function(x){return new Z(-x.re,-x.im)}
Z.itimes   =function(x){x=complexify(x);return simplify(-x.im,x.re)}
Z.negitimes=function(x){x=complexify(x);return simplify(x.im,-x.re)}
Z.add      =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re+y.re,x.im+y.im)}
Z.subtract =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re-y.re,x.im-y.im)}
Z.multiply =function(x,y){x=complexify(x);y=complexify(y);return simplify(x.re*y.re-x.im*y.im,x.re*y.im+x.im*y.re)}
Z.divide   =function(x,y){x=complexify(x);y=complexify(y);var d=y.re*y.re+y.im*y.im
                          return simplify((x.re*y.re+x.im*y.im)/d,(y.re*x.im-y.im*x.re)/d) }

// ¯1 ¯2 ¯3 ¯4*2 ←→ 1 4 9 16
// 0j1*2 ←→ ¯1
// 1j2*3 ←→ ¯11j¯2
// .5j1.5*5 ←→ 9.875j¯0.375
Z.pow=function(x,y){
  if(typeof x==='number'&&typeof y==='number'&&(x>=0||isInt(y)))return Math.pow(x,y)
  if(typeof y==='number'&&isInt(y,0)){var r=1;while(y){(y&1)&&(r=Z.multiply(r,x));x=Z.multiply(x,x);y>>=1};return r}
  return Z.exp(Z.multiply(y,Z.log(x)))
}
Z.sqrt=function(x){return typeof x==='number'&&x>=0?Math.sqrt(x):Z.pow(x,.5)}
Z.magnitude=function(x){return Math.sqrt(x.re*x.re+x.im*x.im)}
Z.direction=function(x){return Math.atan2(x.im,x.re)}
Z.sin=function(x){return Z.negitimes(Z.sinh(Z.itimes(x)))}
Z.cos=function(x){return Z.cosh(Z.itimes(x))}
Z.tan=function(x){return Z.negitimes(Z.tanh(Z.itimes(x)))}

// arcsin x = -i ln(ix + sqrt(1 - x^2))
// arccos x = -i ln(x + i sqrt(x^2 - 1))
// arctan x = (i/2) (ln(1-ix) - ln(1+ix))
Z.asin=function(x){x=complexify(x);return Z.negitimes(Z.log(Z.add(Z.itimes(x),Z.sqrt(Z.subtract(1,Z.pow(x,2))))))}
Z.acos=function(x){
  x=complexify(x);r=Z.negitimes(Z.log(Z.add(x,Z.sqrt(Z.subtract(Z.pow(x,2),1)))))
  // TODO look up the algorithm for determining the sign of arccos; the following line is dubious
  return r instanceof Z&&(r.re<0||(r.re===0&&r.im<0))?Z.negate(r):r
}
Z.atan=function(x){
  x=complexify(x);ix=Z.itimes(x)
  return Z.multiply(new Z(0,.5),Z.subtract(Z.log(Z.subtract(1,ix)),Z.log(Z.add(1,ix))))
}

Z.sinh=function(x){var a=Z.exp(x);return Z.multiply(.5,Z.subtract(a,Z.divide(1,a)))}
Z.cosh=function(x){var a=Z.exp(x);return Z.multiply(.5,Z.add(a,Z.divide(1,a)))}
Z.tanh=function(x){var a=Z.exp(x),b=Z.divide(1,a);return Z.divide(Z.subtract(a,b),Z.add(a,b))}

// arcsinh x =     i arcsin(-ix)
// arccosh x = +/- i arccos(x)
// arctanh x =     i arctan(-ix)
Z.asinh=function(x){return Z.itimes(Z.asin(Z.negitimes(x)))}
Z.acosh=function(x){x=complexify(x);var sign=x.im>0||(!x.im&&x.re<=1)?1:-1;return Z.multiply(new Z(0,sign),Z.acos(x))}
Z.atanh=function(x){return Z.itimes(Z.atan(Z.negitimes(x)))}

Z.floor = function(x){
  if(typeof x==='number')return Math.floor(x)
  x=complexify(x)
  var re=Math.floor(x.re),im=Math.floor(x.im),r=x.re-re,i=x.im-im
  if(r+i>=1)r>=i?re++:im++
  return simplify(re,im)
}
Z.ceil=function(x){
  if(typeof x==='number')return Math.ceil(x)
  x=complexify(x)
  var re=Math.ceil(x.re),im=Math.ceil(x.im),r=re-x.re,i=im-x.im
  if(r+i>=1)r>=i?re--:im--
  return simplify(re,im)
}

function iszero(x){return!x||(x instanceof Z&&!x.re&&!x.im)}

Z.residue=function(x,y){return(typeof x==='number'&&typeof y==='number'?(x?y-x*Math.floor(y/x):y)
                                       :iszero(x)?y:Z.subtract(y,Z.multiply(x,Z.floor(Z.divide(y,x)))))}

Z.isint=function(x){return typeof x==='number'?x===Math.floor(x):x.re===Math.floor(x.re)&&x.im===Math.floor(x.im)}

function firstquadrant(x){ // rotate into first quadrant
  if(typeof x==='number'){return Math.abs(x)}
  else{x.re<0&&(x=Z.negate(x));x.im<0&&(x=Z.itimes(x));return x.re?x:x.im}
}
Z.gcd=function(x,y){
  if(typeof x==='number'&&typeof y==='number'){
    while(y){var z=y;y=x%y;x=z}
    return Math.abs(x)
  }else{
    while(!iszero(y)){var z=y;y=Z.residue(y,x);x=z}
    return firstquadrant(x)
  }
}
Z.lcm=function(x,y){var p=Z.multiply(x,y);return iszero(p)?p:Z.divide(p,Z.gcd(x,y))}
var LDC=1,VEC=2,GET=3,SET=4,MON=5,DYA=6,LAM=7,RET=8,POP=9,SPL=10,JEQ=11,EMB=12,CON=13

function Proc(code,addr,size,env){this.code=code;this.addr=addr;this.size=size;this.env=env}
Proc.prototype.toString=function(){return'#procedure'}
Proc.prototype.toFunction=function(){
  var p=this;return function(x,y){return vm({code:p.code,env:p.env.concat([[x,p,y,null]]),pc:p.addr})}
}

function vm(o){
  var code=o.code,env=o.env,stack=o.stack,pc=o.pc
  assert(code instanceof Array);assert(env instanceof Array);for(var i=0;i<env.length;i++)assert(env[i]instanceof Array)
  stack=stack||[];pc=pc||0
  while(1){
    switch(code[pc++]){
      case LDC:stack.push(code[pc++]);break
      case VEC:
        var a=stack.splice(stack.length-code[pc++])
        for(var i=0;i<a.length;i++)if(a[i].isSimple())a[i]=a[i].unwrap()
        stack.push(new A(a))
        break
      case GET:var r=env[code[pc++]][code[pc++]];r!=null||valueError();stack.push(r);break
      case SET:env[code[pc++]][code[pc++]]=stack[stack.length-1];break
      case MON:
        var wf=stack.splice(-2),w=wf[0],f=wf[1]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(f.cps){
            f(w,undefined,undefined,function(r){stack.push(r);vm({code:code,env:env,stack:stack,pc:pc})})
            return
          }else{
            stack.push(f(w))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,null,bp]])
        }
        break
      case DYA:
        var wfa=stack.splice(-3),w=wfa[0],f=wfa[1],a=wfa[2]
        if(typeof f==='function'){
          if(w instanceof Proc)w=w.toFunction()
          if(a instanceof Proc)a=a.toFunction()
          if(f.cps){
            f(w,a,undefined,function(r){stack.push(r);vm({code:code,env:env,stack:stack,pc:pc})})
            return
          }else{
            stack.push(f(w,a))
          }
        }else{
          var bp=stack.length;stack.push(code,pc,env);code=f.code;pc=f.addr;env=f.env.concat([[w,f,a,bp]])
        }
        break
      case LAM:size=code[pc++];stack.push(new Proc(code,pc,size,env));pc+=size;break
      case RET:
        if(stack.length===1)return stack[0]
        var u=stack.splice(-4,3);code=u[0];pc=u[1];env=u[2]
        break
      case POP:stack.pop();break
      case SPL:
        var n=code[pc++]
        var a=stack[stack.length-1].toArray().reverse()
        for(var i=0;i<a.length;i++)if(!(a[i]instanceof A))a[i]=new A([a[i]],[])
        if(a.length===1){a=repeat(a,n)}else if(a.length!==n){lengthError()}
        stack.push.apply(stack,a)
        break
      case JEQ:var n=code[pc++];stack[stack.length-1].toBool()||(pc+=n);break
      case EMB:var frame=env[env.length-1];stack.push(code[pc++](frame[0],frame[2]));break
      case CON:
        var frame = env[env.length - 1]
        ;(function(){
          var cont={
            code:code,
            env:env.map(function(x){x.slice(0)}),
            stack:stack.slice(0,frame[3]),
            pc:frame[1].addr+frame[1].size-1
          }
          assert(code[cont.pc] === RET)
          stack.push(function(r){code=cont.code;env=cont.env;stack=cont.stack;pc=cont.pc;stack.push(r)})
        }())
        break
      default:aplError('Unrecognized instruction:'+code[pc-1]+',pc:'+pc)
    }
  }
}
var rLetters='_A-Za-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶ-ͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮ-ٯٱ-ۓەۥ-ۦۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴ-ߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘ-ౙౠ-ౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠ-ೡೱ-ೲഅ-ഌഎ-ഐഒ-ഺഽൎൠ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๆກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-ະາ-ຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮ-ᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵ-ᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〆〱-〵〻-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪ-ꘫꙀ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵ-ꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ'
var TD=[ // token definitions
  ['-',/^(?:[ \t]+|[⍝\#].*)+/],        // whitespace and comments
  ['L',/^[\n\r]+/],                    // newline
  ['⋄',/^[◇⋄]/],                       // statement separator
  ['N',RegExp('^¯?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+¯]?\\d+)?|¯|∞)(?:j¯?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+¯]?\\d+)?|¯|∞))?','i')],
  ['S',/^(?:'[^']*')+|^(?:"[^"]*")+/], // string
  ['.',/^[\(\)\[\]\{\}:;←]/],          // punctuation
  ['J',/^«[^»]*»/],                    // JS literal
  ['X',RegExp('^(?:⎕?['+rLetters+']['+rLetters+'0-9]*|⍺⍺|⍵⍵|∇∇|[^¯\'":«»])','i')] // identifier
]
function parse(s,o){ // s:APL source code, o:options
  // Tokenize:
  // A token is {t:type,v:value,o:offset,s:aplCode}
  // "stk" keeps track of bracket nesting and causes 'L' tokens to be dropped when the latest unclosed bracket is '('
  // or '['.  This allows for newlines inside expressions without having them treated as statement separators.
  var i=0,tokens=[],stk=['{'],ns=s.length // i:offset in s
  while(i<ns){
    var m,t,v,s1=s.slice(i) // m:match object, t:type, v:value, s1:remainder of source code
    for(var j=0;j<TD.length;j++)if(m=s1.match(TD[j][1])){v=m[0];t=TD[j][0];t==='.'&&(t=v);break}
    t||syntaxError('Unrecognized token',{file:o?o.file:null,o:i,s:s})
    if(t!=='-'){
      if('([{'.includes(t)){stk.push(t)}else if(')]}'.includes(t)){stk.pop()}
      if(t!=='L'||stk[stk.length-1]==='{')tokens.push({t:t,v:v[0]==='⎕'?v.toUpperCase():v,o:i,s:s})
    }
    i+=v.length
  }
  tokens.push({t:'$',v:'',o:i,s:s})

  // AST node types:
  //   'B'  body        a⋄b
  //   ':'  guard       a:b
  //   'N'  number      1
  //   'S'  string      'a'
  //   'X'  symbol      a
  //   'J'  embedded    «a»
  //   '⍬'  empty       ()
  //   '{'  lambda      {}
  //   '['  index       a[b]
  //   '←'  assign      a←b
  //   '.'  expr        a b
  // The compiler replaces '.' nodes with:
  //   'V'  vector      1 2
  //   'M'  monadic     +1
  //   'D'  dyadic      1+2
  //   'A'  adverb      +/
  //   'C'  conjunction +.×
  //   'T'  atop        +÷
  //   'F'  fork        +÷⍴
  var i=1,token=tokens[0] // single-token lookahead

  // consume(x) consumes the upcoming token and returns a truthy value only if its type matches any character in x.
  function consume(x){if(x.includes(token.t))return token=tokens[i++]}

  // demand() is like consume() but intolerant to a mismatch.
  function demand(x){token.t===x?(token=tokens[i++]):parserError('Expected token of type '+x+' but got '+token.t)}

  function parserError(x){syntaxError(x,{file:o.file,offset:token.o,aplCode:s})}

  function body(){ // parse a body
    var r=['B']
    while(1){
      if('$};'.includes(token.t))return r
      while(consume('⋄L')){}
      if('$};'.includes(token.t))return r
      var e=expr()
      if(consume(':'))e=[':',e,expr()]
      r.push(e)
    }
  }

  function expr(){ // parse an expression
    var r=['.'],item
    while(1){
      var token0=token
      if(consume('NSXJ')){item=[token0.t,token0.v]}
      else if(consume('(')){if(consume(')')){item=['⍬']}else{item=expr();demand(')')}}
      else if(consume('{')){item=['{',body()];while(consume(';')){item.push(body())};demand('}')}
      else{parserError('Encountered unexpected token of type '+token.t)}
      if(consume('[')){
        item=['[',item]
        while(1){
          if(consume(';')){item.push(null)}
          else if(token.t===']'){item.push(null);break}
          else{item.push(expr());if(token.t===']'){break}else{demand(';')}}
        }
        demand(']')
      }
      if(consume('←'))return r.concat([['←',item,expr()]])
      r.push(item)
      if(')]}:;⋄L$'.includes(token.t))return r
    }
  }

  // 'hello'} !!! SYNTAX ERROR
  var r=body();demand('$');return r
}
var vocabulary={}
function addVocabulary(h){for(var k in h)vocabulary[k]=h[k]}

// pervasive() is a higher-order function
//
// Consider a function that accepts and returns only scalars.  To make it
// pervasive means to make it work with any-dimensional arrays, too.
//
// What pervasive() actually does is to take two versions of a scalar function
// (a monadic and a dyadic one), make them pervasive, and combine them into a
// single function that dispatches based on the number of arguments.
function pervasive(h){
  var monad=h.monad,dyad=h.dyad
  var pervadeMonadic=!monad?nonceError:function(x){
    if(x instanceof A)return x.map(pervadeMonadic)
    var r=monad(x);typeof r==='number'&&r!==r&&domainError('NaN');return r
  }
  var pervadeDyadic=!dyad?nonceError:function(x,y){
    // tx,ty: 0=unwrapped scalar; 1=singleton array; 2=non-singleton array
    var tx=x instanceof A?(x.isSingleton()?20:30):10
    var ty=y instanceof A?(y.isSingleton()? 2: 3): 1
    switch(tx+ty){ // todo: use the larger shape when tx=10 and ty=1
      case 11:        var r=dyad(x,y);typeof r==='number'&&r!==r&&domainError('NaN');return r
      case 12:case 13:return y.map(function(yi){return pervadeDyadic(x,yi)})
      case 21:case 31:return x.map(function(xi){return pervadeDyadic(xi,y)})
      case 23:        xi=x.data[x.offset];return y.map(function(yi){return pervadeDyadic(xi,yi)})
      case 32:case 22:yi=y.data[y.offset];return x.map(function(xi){return pervadeDyadic(xi,yi)})
      case 33:
        x.shape.length!==y.shape.length&&rankError()
        x.shape!=''+y.shape&&lengthError()
        return x.map2(y,pervadeDyadic)
      default:assert(0)
    }
  }
  return function(om,al){
    assert(om instanceof A);assert(al instanceof A||al==null)
    return(al!=null?pervadeDyadic:pervadeMonadic)(om,al)
  }
}
function real(f){return function(x,y,axis){
  return typeof x!=='number'||y!=null&&typeof y!=='number'?domainError():f(x,y,axis)
}}
function numeric(f,g){return function(x,y,axis){
  return(typeof x!=='number'||y!=null&&typeof y!=='number'?g(complexify(x),y==null?y:complexify(y),axis):f(x,y,axis))
}}
function match(x,y){
  if(x instanceof A){
    if(!(y instanceof A)||x.shape!=''+y.shape)return 0
    var r=1;each2(x,y,function(xi,yi){r&=match(xi,yi)});return r
  }else{
    if(y instanceof A)return 0
    if(x instanceof Z&&y instanceof Z)return x.re===y.re&&x.im===y.im
    return x===y
  }
}
function numApprox(x,y){return x===y||Math.abs(x-y)<1e-11}
function approx(x,y){
  // approx() is like match(), but it is tolerant to precision errors;
  // used for comparing expected and actual results in doctests
  if(x instanceof A){
    if(!(y instanceof A))return 0
    if(x.shape.length!==y.shape.length)return 0
    if(x.shape!=''+y.shape)return 0
    var r=1;each2(x,y,function(xi,yi){r&=approx(xi,yi)});return r
  }else{
    if(y instanceof A)return 0
    if(x==null||y==null)return 0
    if(typeof x==='number')x=new Z(x)
    if(typeof y==='number')y=new Z(y)
    if(x instanceof Z)return y instanceof Z&&numApprox(x.re,y.re)&&numApprox(x.im,y.im)
    return x===y
  }
}
function bool(x){return(x&1)!==x?domainError():x}
function getAxisList(axes,rank){
  assert(isInt(rank,0))
  if(axes==null)return[]
  assert(axes instanceof A)
  if(axes.shape.length!==1||axes.shape[0]!==1)syntaxError() // [sic]
  var a=axes.unwrap()
  if(a instanceof A){
    a=a.toArray()
    for(var i=0;i<a.length;i++){
      isInt(a[i],0,rank)||domainError()
      a.indexOf(a[i])<i&&domainError('Non-unique axes')
    }
    return a
  }else if(isInt(a,0,rank)){
    return[a]
  }else{
    domainError()
  }
}
function withIdentity(x,f){f.identity=x instanceof A?x:A.scalar(x);return f}
function adverb     (f){f.adv =1;return f}
function conjunction(f){f.conj=1;return f}
function cps        (f){f.cps =1;return f}
addVocabulary({
  '+':withIdentity(0,pervasive({
    // +4            ←→ 4
    // ++4           ←→ 4
    // +4 5          ←→ 4 5
    // +((5 6)(7 1)) ←→ (5 6)(7 1)
    // + (5 6)(7 1)  ←→ (5 6)(7 1)
    // +1j¯2         ←→ 1j2
    monad:numeric(
      function(x){return x},
      Z.conjugate
    ),
    // 1+2                      ←→ 3
    // 2 3+5 8                  ←→ 7 11
    // (2 3⍴1 2 3 4 5 6)+    ¯2 ←→ 2 3 ⍴ ¯1 0 1 2 3 4
    // (2 3⍴1 2 3 4 5 6)+  2⍴¯2 !!! RANK ERROR
    // (2 3⍴1 2 3 4 5 6)+2 3⍴¯2 ←→ 2 3 ⍴ ¯1 0 1 2 3 4
    // 1 2 3+4 5                !!! LENGTH ERROR
    // (2 3⍴⍳6)+3 2⍴⍳6          !!! LENGTH ERROR
    // 1j¯2+¯2j3                ←→ ¯1j1
    // +/⍬                      ←→ 0
    // ¯+¯¯                     !!! DOMAIN ERROR
    // 1j¯+2j¯¯                 !!! DOMAIN ERROR
    dyad:numeric(
      function(y,x){return x+y},
      function(y,x){return Z.add(x,y)}
    )
  })),
  '-':withIdentity(0,pervasive({
    // -4     ←→ ¯4
    // -1 2 3 ←→ ¯1 ¯2 ¯3
    // -1j2   ←→ ¯1j¯2
    monad:numeric(
      function(x){return-x},
      Z.negate
    ),
    // 1-3     ←→ ¯2
    // 5-¯3    ←→ 8
    // 5j2-3j8 ←→ 2j¯6
    // 5-3j8   ←→ 2j¯8
    // -/⍬     ←→ 0
    dyad:numeric(
      function(y,x){return x-y},
      function(y,x){return Z.subtract(x,y)}
    )
  })),
  '×':withIdentity(1,pervasive({
    // ×¯2 ¯1 0 1 2 ←→ ¯1 ¯1 0 1 1
    // ×¯           ←→ 1
    // ×¯¯          ←→ ¯1
    // ×3j¯4        ←→ .6j¯.8
    monad:numeric(
      function(x){return(x>0)-(x<0)},
      function(x){var d=Math.sqrt(x.re*x.re+x.im*x.im);return simplify(x.re/d,x.im/d)}
    ),
    // 7×8       ←→ 56
    // 1j¯2×¯2j3 ←→ 4j7
    // 2×1j¯2    ←→ 2j¯4
    // ×/⍬       ←→ 1
    dyad:numeric(
      function(y,x){return x*y},
      function(y,x){return Z.multiply(x,y)}
    )
  })),
  '÷': withIdentity(1, pervasive({
    // ÷2   ←→ .5
    // ÷2j3 ←→ 0.15384615384615385J¯0.23076923076923078
    // 0÷0  !!! DOMAIN ERROR
    monad:numeric(
      function(x){return 1/x},
      function(x){var d=x.re*x.re+x.im*x.im;return simplify(x.re/d,-x.im/d)}
    ),
    // 27÷9     ←→ 3
    // 4j7÷1j¯2 ←→ ¯2j3
    // 0j2÷0j1  ←→ 2
    // 5÷2j1    ←→ 2j¯1
    // ÷/⍬      ←→ 1
    dyad:numeric(
      function(y,x){return x/y},
      function(y,x){return Z.divide(x,y)}
    )
  })),
  '*':withIdentity(1,pervasive({
    // *2   ←→ 7.38905609893065
    // *2j3 ←→ ¯7.315110094901103J1.0427436562359045
    monad:exp=numeric(Math.exp,Z.exp),
    // 2*3 ←→ 8
    // 3*2 ←→ 9
    // ¯2*3 ←→ ¯8
    // ¯3*2 ←→ 9
    // ¯1*.5 ←→ 0j1
    // 1j2*3j4 ←→ .129009594074467j.03392409290517014
    // */⍬ ←→ 1
    dyad:function(y,x){return Z.pow(x,y)}
  })),
  '⍟':pervasive({
    // ⍟123 ←→ 4.812184355372417
    // ⍟0 ←→ ¯¯
    // ⍟¯1 ←→ 0j1×○1
    // ⍟123j456 ←→ 6.157609243895447J1.3073297857599793
    monad:Z.log,
    // 12⍟34 ←→ 1.419111870829036
    // 12⍟¯34 ←→ 1.419111870829036j1.26426988871305
    // ¯12⍟¯34 ←→ 1.1612974763994781j¯.2039235425372641
    // 1j2⍟3j4 ←→ 1.2393828252698689J¯0.5528462880299602
    dyad:function(y,x){
      return typeof x==='number'&&typeof y==='number'&&x>0&&y>0?Math.log(y)/Math.log(x):Z.divide(Z.log(y),Z.log(x))
    }
  }),
  '|': withIdentity(0, pervasive({
    // ∣¯8 0 8 ¯3.5 ←→ 8 0 8 3.5
    // |5j12 ←→ 13
    monad:numeric(function(x){return Math.abs(x)},Z.magnitude),
    // 3∣5 ←→ 2
    // 1j2|3j4 ←→ ¯1j1
    // 7 ¯7∘.|31 28 ¯30        ←→ 2 3⍴3 0 5 ¯4 0 ¯2
    // ¯0.2 0 0.2∘.|¯0.3 0 0.3 ←→ 3 3⍴¯0.1 0 ¯0.1 ¯0.3 0 0.3 0.1 0 0.1
    // |/⍬ ←→ 0
    // 0|¯4 ←→ ¯4
    // 0|¯4j5 ←→ ¯4j5
    // 10|4j3 ←→ 4j3
    // 4j6|7j10 ←→ 3j4
    // ¯10 7j10 0.3|17 5 10 ←→ ¯3 ¯5j7 0.1
    dyad:function(y,x){return Z.residue(x,y)}
  }))
})
var scanOrExpand
addVocabulary({
  '⍀':adverb(function(om,al,axis){return scanOrExpand(om,al,axis||A.zero)}),

  // +\20 10 ¯5 7               ←→ 20 30 25 32
  // ,\"AB" "CD" "EF"           ←→ 'AB' 'ABCD' 'ABCDEF'
  // ×\2 3⍴5 2 3 4 7 6          ←→ 2 3⍴5 10 30 4 28 168
  // ∧\1 1 1 0 1 1              ←→ 1 1 1 0 0 0
  // -\1 2 3 4                  ←→ 1 ¯1 2 ¯2
  // ∨\0 0 1 0 0 1 0            ←→ 0 0 1 1 1 1 1
  // +\1 2 3 4 5                ←→ 1 3 6 10 15
  // +\(1 2 3)(4 5 6)(7 8 9)    ←→ (1 2 3)(5 7 9)(12 15 18)
  // M←2 3⍴1 2 3 4 5 6 ⋄ +\M    ←→ 2 3 ⍴ 1 3 6 4 9 15
  // M←2 3⍴1 2 3 4 5 6 ⋄ +⍀M    ←→ 2 3 ⍴ 1 2 3 5 7 9
  // M←2 3⍴1 2 3 4 5 6 ⋄ +\[0]M ←→ 2 3 ⍴ 1 2 3 5 7 9
  // ,\'ABC'                    ←→ 'A' 'AB' 'ABC'
  // T←"ONE(TWO) BOOK(S)" ⋄ ≠\T∊"()" ←→ 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0
  // T←"ONE(TWO) BOOK(S)" ⋄ ((T∊"()")⍱≠\T∊"()")/T ←→ 'ONE BOOK'
  // 1 0 1\'ab'          ←→ 'a b'
  // 0 1 0 1 0\2 3       ←→ 0 2 0 3 0
  // (2 2⍴0)\'food'      !!! RANK ERROR
  // 'abc'\'def'         !!! DOMAIN ERROR
  // 1 0 1 1\'ab'        !!! LENGTH ERROR
  // 1 0 1 1\'abcd'      !!! LENGTH ERROR
  // 1 0 1\2 2⍴'ABCD'    ←→ 2 3⍴'A BC D'
  // 1 0 1⍀2 2⍴'ABCD'    ←→ 3 2⍴'AB  CD'
  // 1 0 1\[0]2 2⍴'ABCD' ←→ 3 2⍴'AB  CD'
  // 1 0 1\[1]2 2⍴'ABCD' ←→ 2 3⍴'A BC D'
  '\\':scanOrExpand=adverb(function(om,al,axis){
    if(typeof om==='function'){
      assert(typeof al==='undefined')
      var f=om
      return function(om,al){
        assert(al==null)
        if(!om.shape.length)return om
        axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
        return om.map(function(x,indices,p){
          x instanceof A||(x=A.scalar(x))
          for(var j=0,nj=indices[axis];j<nj;j++){
            p-=om.stride[axis]
            y=om.data[p]
            y instanceof A||(y=A.scalar(y))
            x=f(x,y)
          }
          x.shape.length||(x=x.unwrap())
          return x
        })
      }
    }else{
      om.shape.length||nonceError('Expand of scalar not implemented')
      axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
      al.shape.length>1&&rankError()
      var a=al.toArray(),b=[],i=0,shape=om.shape.slice(0);shape[axis]=a.length
      for(var j=0;j<a.length;j++){isInt(a[j],0,2)||domainError();b.push(a[j]>0?i++:null)}
      i===om.shape[axis]||lengthError()
      var data=[]
      if(shape[axis]&&!om.empty()){
        var filler=om.getPrototype(),p=om.offset,indices=repeat([0],shape.length)
        while(1){
          data.push(b[indices[axis]]==null?filler:om.data[p+b[indices[axis]]*om.stride[axis]])
          var i=shape.length-1
          while(i>=0&&indices[i]+1===shape[i]){
            if(i!==axis)p-=om.stride[i]*indices[i]
            indices[i--]=0
          }
          if(i<0)break
          if(i!==axis)p+=om.stride[i]
          indices[i]++
        }
      }
      return new A(data,shape)
    }
  })
})
addVocabulary({
  '○':pervasive({
    // ○2     ←→ 6.283185307179586
    // ○2J2   ←→ 6.283185307179586J6.283185307179586
    // ○'ABC' !!! DOMAIN ERROR
    monad:numeric(
      function(x){return Math.PI*x},
      function(x){return new Z(Math.PI*x.re,Math.PI*x.im)}
    ),
    // ¯12○2          ←→ ¯0.4161468365471J0.9092974268257
    // ¯12○2j3        ←→ ¯0.02071873100224J0.04527125315609
    // ¯11○2          ←→ 0j2
    // ¯11○2j3        ←→ ¯3j2
    // ¯10○2          ←→ 2
    // ¯10○2j3        ←→ 2j¯3
    // ¯9○2           ←→ 2
    // ¯9○2j3         ←→ 2j3
    // ¯8○2           ←→ 0J¯2.2360679774998
    // ¯8○2j3         ←→ ¯2.8852305489054J2.0795565201111
    // ¯7○0.5         ←→ 0.54930614433405
    // ¯7○2           ←→ 0.5493061443340548456976226185j¯1.570796326794896619231321692
    // ¯7○2j3         ←→ 0.1469466662255297520474327852j1.338972522294493561124193576
    // ¯6○0.5         ←→ ¯1.1102230246252E¯16J1.0471975511966
    // ¯6○2           ←→ 1.316957896924816708625046347
    // ¯6○2j3         ←→ 1.983387029916535432347076903j1.000143542473797218521037812
    // ¯5○2           ←→ 1.443635475178810342493276740
    // ¯5○2j3         ←→ 1.968637925793096291788665095j0.9646585044076027920454110595
    // ¯4○2           ←→ 1.7320508075689
    // ¯4○0           ←→ 0j1
    // ¯4○¯2          ←→ ¯1.7320508075689
    // ¯4○2j3         ←→ 1.9256697360917J3.1157990841034
    // ¯3○0.5         ←→ 0.46364760900081
    // ¯3○2           ←→ 1.107148717794090503017065460
    // ¯3○2j3         ←→ 1.409921049596575522530619385j0.2290726829685387662958818029
    // ¯2○0.5         ←→ 1.0471975511966
    // ¯2○2           ←→ 0J1.316957896924816708625046347
    // ¯2○2j3         ←→ 1.000143542473797218521037812J¯1.983387029916535432347076903
    // ¯1○0.5         ←→ 0.5235987755983
    // ¯1○2           ←→ 1.570796326794896619231321692J¯1.316957896924816708625046347
    // ¯1○2j3         ←→ 0.5706527843210994007102838797J1.983387029916535432347076903
    // 0○0.5          ←→ 0.86602540378444
    // 0○2            ←→ 0J1.7320508075689
    // 0○2j3          ←→ 3.1157990841034J¯1.9256697360917
    // 1e¯10>∣.5-1○○÷6 ←→ 1 # sin(pi/6) = .5
    // 1○1            ←→ 0.8414709848079
    // 1○2j3          ←→ 9.1544991469114J¯4.1689069599666
    // 2○1            ←→ 0.54030230586814
    // 2○2j3          ←→ ¯4.1896256909688J¯9.1092278937553
    // 3○1            ←→ 1.5574077246549
    // 3○2j3          ←→ ¯0.0037640256415041J1.0032386273536
    // 4○2            ←→ 2.2360679774998
    // 4○2j3          ←→ 2.0795565201111J2.8852305489054
    // 5○2            ←→ 3.626860407847
    // 5○2j3          ←→ ¯3.5905645899858J0.53092108624852
    // 6○2            ←→ 3.7621956910836
    // 6○2j3          ←→ ¯3.7245455049153J0.51182256998738
    // 7○2            ←→ 0.96402758007582
    // 7○2j3          ←→ 0.96538587902213J¯0.0098843750383225
    // 8○2            ←→ 0J2.2360679774998
    // 8○2j3          ←→ 2.8852305489054J¯2.0795565201111
    // 9○2            ←→ 2
    // 9○2j3          ←→ 2
    // 10○¯2          ←→ 2
    // 10○¯2j3        ←→ 3.605551275464
    // 11○2           ←→ 0
    // 11○2j3         ←→ 3
    // 12○2           ←→ 0
    // 12○2j3         ←→ 0.98279372324733
    // 1○'hello'      !!! DOMAIN ERROR
    // 99○1           !!! DOMAIN ERROR
    // 99○1j2         !!! DOMAIN ERROR
    dyad:function(x,i){
      if(typeof x==='number'){
        switch(i){
          case-12:return Z.exp(simplify(0,x))
          case-11:return simplify(0,x)
          case-10:return x
          case -9:return x
          case -8:return simplify(0,-Math.sqrt(1+x*x))
          case -7:return Z.atanh(x)
          case -6:return Z.acosh(x)
          case -5:return Z.asinh(x)
          case -4:var t=Z.sqrt(x*x-1);return x<-1?-t:t
          case -3:return Z.atan(x)
          case -2:return Z.acos(x)
          case -1:return Z.asin(x)
          case  0:return Z.sqrt(1-x*x)
          case  1:return Math.sin(x)
          case  2:return Math.cos(x)
          case  3:return Math.tan(x)
          case  4:return Math.sqrt(1+x*x)
          case  5:var a=Math.exp(x),b=1/a;return(a-b)/2     // sinh
          case  6:var a=Math.exp(x),b=1/a;return(a+b)/2     // cosh
          case  7:var a=Math.exp(x),b=1/a;return(a-b)/(a+b) // tanh
          case  8:return Z.sqrt(-1-x*x)
          case  9:return x
          case 10:return Math.abs(x)
          case 11:return 0
          case 12:return 0
          default:domainError('Unknown circular or hyperbolic function:'+i)
        }
      }else if(x instanceof Z){
        switch(i){
          case -12:return Z.exp(simplify(-x.im,x.re))
          case -11:return Z.itimes(x)
          case -10:return Z.conjugate(x)
          case  -9:return x
          case  -8:return Z.negate(Z.sqrt(Z.subtract(-1,Z.multiply(x,x))))
          case  -7:return Z.atanh(x)
          case  -6:return Z.acosh(x)
          case  -5:return Z.asinh(x)
          case  -4:
            if(x.re===-1&&!x.im)return 0
            var a=Z.add(x,1),b=Z.subtract(x,1);return Z.multiply(a,Z.sqrt(Z.divide(b,a)))
          case  -3:return Z.atan(x)
          case  -2:return Z.acos(x)
          case  -1:return Z.asin(x)
          case   0:return Z.sqrt(Z.subtract(1,Z.multiply(x,x)))
          case   1:return Z.sin(x)
          case   2:return Z.cos(x)
          case   3:return Z.tan(x)
          case   4:return Z.sqrt(Z.add(1,Z.multiply(x,x)))
          case   5:return Z.sinh(x)
          case   6:return Z.cosh(x)
          case   7:return Z.tanh(x)
          case   8:return Z.sqrt(Z.subtract(-1,Z.multiply(x,x)))
          case   9:return x.re
          case  10:return Z.magnitude(x)
          case  11:return x.im
          case  12:return Z.direction(x)
          default:domainError('Unknown circular or hyperbolic function:'+i)
        }
      }else{
        domainError()
      }
    }
  })
})
addVocabulary({
  ',':function(om,al,axis){
    if(al){
      // 10,66               ←→ 10 66
      // '10 ','MAY ','1985' ←→ '10 MAY 1985'
      // (2 3⍴⍳6),2 2⍴⍳4     ←→ 2 5⍴(0 1 2 0 1  3 4 5 2 3)
      // (3 2⍴⍳6),2 2⍴⍳4     !!! LENGTH ERROR
      // (2 3⍴⍳6),9          ←→ 2 4⍴(0 1 2 9  3 4 5 9)
      // (2 3 4⍴⍳24),99      ←→ 2 3 5⍴(0  1  2  3 99
      // ...                           4  5  6  7 99
      // ...                           8  9 10 11 99
      // ...
      // ...                          12 13 14 15 99
      // ...                          16 17 18 19 99
      // ...                          20 21 22 23 99)
      // ⍬,⍬                 ←→ ⍬
      // ⍬,1                 ←→ ,1
      // 1,⍬                 ←→ ,1
      var nAxes=Math.max(al.shape.length,om.shape.length)
      if(axis){
        axis=axis.unwrap()
        typeof axis!=='number'&&domainError()
        nAxes&&!(-1<axis&&axis<nAxes)&&rankError()
      }else{
        axis=nAxes-1
      }

      if(!al.shape.length&&!om.shape.length){
        return new A([al.unwrap(),om.unwrap()])
      }else if(!al.shape.length){
        var s=om.shape.slice(0)
        if(isInt(axis))s[axis]=1
        al=new A([al.unwrap()],s,repeat([0],om.shape.length))
      }else if(!om.shape.length){
        var s=al.shape.slice(0)
        if(isInt(axis))s[axis]=1
        om=new A([om.unwrap()],s,repeat([0],al.shape.length))
      }else if(al.shape.length+1===om.shape.length){
        isInt(axis)||rankError()
        var shape =al.shape .slice(0);shape .splice(axis,0,1)
        var stride=al.stride.slice(0);stride.splice(axis,0,0)
        al=new A(al.data,shape,stride,al.offset)
      }else if(al.shape.length===om.shape.length+1){
        isInt(axis)||rankError()
        var shape =om.shape .slice(0);shape .splice(axis,0,1)
        var stride=om.stride.slice(0);stride.splice(axis,0,0)
        om=new A(om.data,shape,stride,om.offset)
      }else if(al.shape.length!==om.shape.length){
        rankError()
      }

      assert(al.shape.length===om.shape.length)
      for(var i=0;i<al.shape.length;i++)if(i!==axis&&al.shape[i]!==om.shape[i])lengthError()

      var shape=al.shape.slice(0);if(isInt(axis)){shape[axis]+=om.shape[axis]}else{shape.splice(Math.ceil(axis),0,2)}
      var data=Array(prod(shape))
      var stride=Array(shape.length);stride[shape.length-1]=1
      for(var i=shape.length-2;i>=0;i--)stride[i]=stride[i+1]*shape[i+1]

      var rStride=stride;if(!isInt(axis)){rStride=stride.slice(0);rStride.splice(Math.ceil(axis),1)}
      if(!al.empty()){
        var r=0,p=al.offset // r:pointer in data (the result), p:pointer in al.data
        var pIndices=repeat([0],al.shape.length)
        while(1){
          data[r]=al.data[p]
          var a=pIndices.length-1
          while(a>=0&&pIndices[a]+1===al.shape[a]){
            p-=pIndices[a]*al.stride[a];r-=pIndices[a]*rStride[a];pIndices[a--]=0
          }
          if(a<0)break
          p+=al.stride[a];r+=rStride[a];pIndices[a]++
        }
      }
      if(!om.empty()){
        var r=isInt(axis)?stride[axis]*al.shape[axis]:stride[Math.ceil(axis)] // pointer in data (the result)
        var q=om.offset // pointer in ⍵.data
        var pIndices=repeat([0],om.shape.length)
        while(1){
          data[r]=om.data[q]
          var a=pIndices.length-1
          while(a>=0&&pIndices[a]+1===om.shape[a]){
            q-=pIndices[a]*om.stride[a];r-=pIndices[a]*rStride[a];pIndices[a--]=0
          }
          if(a<0)break
          q+=om.stride[a];r+=rStride[a];pIndices[a]++
        }
      }
      return new A(data,shape,stride)
    }else{
      assert(0)
    }
  }
})
var eq
addVocabulary({
  // 12=12               ←→ 1
  // 2=12                ←→ 0
  // "Q"="Q"             ←→ 1
  // 1="1"               ←→ 0
  // "1"=1               ←→ 0
  // 11 7 2 9=11 3 2 6   ←→ 1 0 1 0
  // "STOAT"="TOAST"     ←→ 0 0 0 0 1
  // 8=2+2+2+2           ←→ 1
  // (2 3⍴1 2 3 4 5 6)=2 3⍴3 3 3 5 5 5 ←→ 2 3⍴0 0 1 0 1 0
  // 3=2 3⍴1 2 3 4 5 6   ←→ 2 3⍴0 0 1 0 0 0
  // 3=(2 3⍴1 2 3 4 5 6)(2 3⍴3 3 3 5 5 5)
  // ... ←→ (2 3⍴0 0 1 0 0 0)(2 3⍴1 1 1 0 0 0)
  // 2j3=2j3             ←→ 1
  // 2j3=3j2             ←→ 0
  // 0j0                 ←→ 0
  // 123j0               ←→ 123
  // 2j¯3+¯2j3           ←→ 0
  // =/⍬                 ←→ 1
  '=':withIdentity(1,pervasive({dyad:eq=function(y,x){
    return+(x instanceof Z&&y instanceof Z?x.re===y.re&&x.im===y.im:x===y)
  }})),

  // 3≢5 ←→ 1
  // 8≠8 ←→ 0
  // ≠/⍬ ←→ 0
  '≠':withIdentity(0,pervasive({dyad:function(y,x){return 1-eq(y,x)}})),

  // </⍬ ←→ 0
  // >/⍬ ←→ 0
  // ≤/⍬ ←→ 1
  // ≥/⍬ ←→ 1
  '<':withIdentity(0,pervasive({dyad:real(function(y,x){return+(x< y)})})),
  '>':withIdentity(0,pervasive({dyad:real(function(y,x){return+(x> y)})})),
  '≤':withIdentity(1,pervasive({dyad:real(function(y,x){return+(x<=y)})})),
  '≥':withIdentity(1,pervasive({dyad:real(function(y,x){return+(x>=y)})})),

  // 3≡3                    ←→ 1
  // 3≡,3                   ←→ 0
  // 4 7.1 8≡4 7.2 8        ←→ 0
  // (3 4⍴⍳12)≡3 4⍴⍳12      ←→ 1
  // (3 4⍴⍳12)≡⊂3 4⍴⍳12     ←→ 0
  // ("ABC" "DEF")≡"ABCDEF" ←→ 0
  //! (⍳0)≡""               ←→ 0
  // (2 0⍴0)≡(0 2⍴0)        ←→ 0
  //! (0⍴1 2 3)≡0⍴⊂2 2⍴⍳4   ←→ 0
  // ≡4                      ←→ 0
  // ≡⍳4                     ←→ 1
  // ≡2 2⍴⍳4                 ←→ 1
  // ≡"abc"1 2 3(23 55)      ←→ 2
  // ≡"abc"(2 4⍴"abc"2 3"k") ←→ 3
  '≡':function(om,al){return al?A.bool[+match(om,al)]:new A([depthOf(om)],[])}
})
function depthOf(x){
  if(!(x instanceof A)||!x.shape.length&&!(x.data[0]instanceof A))return 0
  var r=0;each(x,function(y){r=Math.max(r,depthOf(y))});return r+1
}
addVocabulary({
  // (÷∘-)2     ←→ ¯0.5
  // 8(÷∘-)2    ←→ ¯4
  // ÷∘-2       ←→ ¯0.5
  // 8÷∘-2      ←→ ¯4
  // ⍴∘⍴2 3⍴⍳6  ←→ ,2
  // 3⍴∘⍴2 3⍴⍳6 ←→ 2 3 2
  // 3∘-1       ←→ 2
  // (-∘2)9     ←→ 7
  '∘':conjunction(function(g,f){
    if(typeof f==='function'){
      if(typeof g==='function'){
        return function(om,al){return f(g(om),al)} // f∘g
      }else{
        return function(om,al){al==null||syntaxError('The function does not take a left argument');return f(g,om)} // f∘B
      }
    }else{
      assert(typeof g==='function')
      return function(om,al){al==null||syntaxError('The function does not take a left argument');return g(om,f)} // A∘g
    }
  })
})
addVocabulary({
  '∪':function(om,al){
    if(al){
      // 1 2∪2 3     ←→ 1 2 3
      // 'SHOCK'∪'CHOCOLATE' ←→ 'SHOCKLATE'
      // 1∪1         ←→ ,1
      // 1∪2         ←→ 1 2
      // 1∪2 1       ←→ 1 2
      // 1 2∪2 2 2 2 ←→ 1 2
      // 1 2∪2 2⍴3   !!! RANK ERROR
      // (2 2⍴3)∪4 5 !!! RANK ERROR
      // ⍬∪1         ←→ ,1
      // 1 2∪⍬       ←→ 1 2
      // ⍬∪⍬         ←→ ⍬
      // 2 3 3∪4 5 3 4 ←→ 2 3 3 4 5 4
      // 'lentils' 'bulghur'(3 4 5)∪'lentils' 'rice' ←→ 'lentils' 'bulghur'(3 4 5)'rice'
      if(al.shape.length>1||om.shape.length>1)rankError()
      var a=al.toArray(),r=[];each(om,function(x){contains(a,x)||r.push(x)});return new A(a.concat(r))
    }else{
      // ∪3 17 17 17 ¯3 17 0 ←→ 3 17 ¯3 0
      // ∪3 17               ←→ 3 17
      // ∪17                 ←→ ,17
      // ∪⍬                  ←→ ⍬
      if(om.shape.length>1)rankError()
      var r=[];each(om,function(x){contains(r,x)||r.push(x)});return new A(r)
    }
  },
  '∩':function(om,al){
    if(al){
      // 'ABRA'∩'CAR' ←→ 'ARA'
      // 1'PLUS'2∩⍳5  ←→ 1 2
      // 1∩2          ←→ ⍬
      // 1∩2 3⍴4      !!! RANK ERROR
      if(al.shape.length>1||om.shape.length>1)rankError()
      var r=[],b=om.toArray();each(al,function(x){contains(b,x)&&r.push(x)})
      return new A(r)
    }else{
      // ∩1 !!! NONCE ERROR
      nonceError()
    }
  }
})
function contains(a,x){for(var i=0;i<a.length;i++)if(match(x,a[i]))return 1}
addVocabulary({
  // 10⊥3 2 6 9                        ←→ 3269
  // 8⊥3 1                             ←→ 25
  // 1760 3 12⊥1 2 8                   ←→ 68
  // 2 2 2⊥1                           ←→ 7
  // 0 20 12 4⊥2 15 6 3                ←→ 2667
  // 1760 3 12⊥3 3⍴1 1 1 2 0 3 0 1 8   ←→ 60 37 80
  // 60 60⊥3 13                        ←→ 193
  // 0 60⊥3 13                         ←→ 193
  // 60⊥3 13                           ←→ 193
  // 2⊥1 0 1 0                         ←→ 10
  // 2⊥1 2 3 4                         ←→ 26
  // 3⊥1 2 3 4                         ←→ 58
  //
  // //gives '(1j1⊥1 2 3 4) = 5j9', 1 # todo:⊥for complex numbers
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... A←(4 3⍴1 1 1
  // ...        2 2 2
  // ...        3 3 3
  // ...        4 4 4)
  // ... A⊥M ←→ (4 8⍴0 1 1 2  1  2  2  3
  // ...             0 1 2 3  4  5  6  7
  // ...             0 1 3 4  9 10 12 13
  // ...             0 1 4 5 16 17 20 21)
  //
  // M←(3 8⍴0 0 0 0 1 1 1 1
  // ...    0 0 1 1 0 0 1 1
  // ...    0 1 0 1 0 1 0 1)
  // ... 2⊥M ←→ 0 1 2 3 4 5 6 7
  //
  // M←(3 8 ⍴0 0 0 0 1 1 1 1
  // ...     0 0 1 1 0 0 1 1
  // ...     0 1 0 1 0 1 0 1)
  // ... A←2 1⍴2 10
  // ... A⊥M ←→ (2 8⍴0 1  2  3   4   5   6   7
  // ...             0 1 10 11 100 101 110 111)
  '⊥':function(om,al){
    assert(al)
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    var lastDimA=al.shape[al.shape.length-1],firstDimB=om.shape[0]
    if(lastDimA!==1&&firstDimB!==1&&lastDimA!==firstDimB)lengthError()
    var a=al.toArray(),b=om.toArray(),data=[],ni=a.length/lastDimA,nj=b.length/firstDimB
    for(var i=0;i<ni;i++)for(var j=0;j<nj;j++){
      var x=a.slice(i*lastDimA,(i+1)*lastDimA)
      var y=[];for(var l=0;l<firstDimB;l++)y.push(b[j+l*(b.length/firstDimB)])
      if(x.length===1)x=repeat([x[0]],y.length)
      if(y.length===1)y=repeat([y[0]],x.length)
      var z=y[0];for(var k=1;k<y.length;k++)z=z*x[k]+y[k]
      data.push(z)
    }
    return new A(data,al.shape.slice(0,-1).concat(om.shape.slice(1)))
  }
})
addVocabulary({
  '.':conjunction(function(g,f){return f===vocabulary['∘']?outerProduct(g):innerProduct(g,f)})
})
// 2 3 4∘.×1 2 3 4 ←→ (3 4⍴2 4  6  8
// ...                     3 6  9 12
// ...                     4 8 12 16)
//
// 0 1 2 3 4∘.!0 1 2 3 4 ←→ (5 5⍴1 1 1 1 1
// ...                           0 1 2 3 4
// ...                           0 0 1 3 6
// ...                           0 0 0 1 4
// ...                           0 0 0 0 1)
//
// 1 2∘.,1+⍳3 ←→ (2 3⍴(1 1)(1 2)(1 3)
// ...                (2 1)(2 2)(2 3))
//
// ⍴1 2∘.,1+⍳3 ←→ 2 3
//
// 2 3∘.↑1 2 ←→ (2 2⍴  (1 0)   (2 0)
// ...               (1 0 0) (2 0 0))
//
// ⍴2 3∘.↑1 2 ←→ 2 2
// ⍴((4 3⍴0)∘.+5 2⍴0) ←→ 4 3 5 2
// 2 3∘.×4 5      ←→ 2 2⍴8 10 12 15
// 2 3∘ . ×4 5    ←→ 2 2⍴8 10 12 15
// 2 3∘.{⍺×⍵}4 5  ←→ 2 2⍴8 10 12 15
function outerProduct(f){
  assert(typeof f==='function')
  return function(om,al){
    al||syntaxError('Adverb ∘. (Outer product) can be applied to dyadic verbs only')
    var a=al.toArray(),b=om.toArray(),data=[]
    for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++){
      var x=a[i],y=b[j]
      x instanceof A||(x=A.scalar(x))
      y instanceof A||(y=A.scalar(y))
      var z=f(y,x)
      z.shape.length||(z=z.unwrap())
      data.push(z)
    }
    return new A(data,al.shape.concat(om.shape))
  }
}
// For matrices, the inner product behaves like matrix multiplication where +
// and × can be substituted with any verbs.
//
// For higher dimensions, the general formula is:
// A f.g B   <->   f/¨ (⊂[¯1+⍴⍴A]A) ∘.g ⊂[0]B
//
// (1 3 5 7)+.=2 3 6 7 ←→ 2
// (1 3 5 7)∧.=2 3 6 7 ←→ 0
// (1 3 5 7)∧.=1 3 5 7 ←→ 1
// 7+.=8 8 7 7 8 7 5   ←→ 3
// 8 8 7 7 8 7 5+.=7   ←→ 3
// 7+.=7               ←→ 1
// (3 2⍴5 ¯3 ¯2 4 ¯1 0)+.×2 2⍴6 ¯3 5 7 ←→ 3 2⍴15 ¯36 8 34 ¯6 3
function innerProduct(g,f){
  var F=vocabulary['¨'](reduce(f)),G=outerProduct(g)
  return function(om,al){
    if(!al.shape.length)al=new A([al.unwrap()])
    if(!om.shape.length)om=new A([om.unwrap()])
    return F(G(
      vocabulary['⊂'](om,undefined,new A([0])),
      vocabulary['⊂'](al,undefined,new A([al.shape.length-1]))
    ))
  }
}
addVocabulary({
  // ⍴¨(0 0 0 0)(0 0 0)             ←→ (,4)(,3)
  // ⍴¨"MONDAY" "TUESDAY"           ←→ (,6)(,7)
  // ⍴   (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨  (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (2 2)(,10)⍬(3 4)
  // ⍴⍴¨ (2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ ,4
  // ⍴¨⍴¨(2 2⍴⍳4)(⍳10)97.3(3 4⍴"K") ←→ (,2)(,1)(,0)(,2)
  // (1 2 3) ,¨ 4 5 6               ←→ (1 4)(2 5)(3 6)
  // 2 3↑¨'MONDAY' 'TUESDAY'        ←→ 'MO' 'TUE'
  // 2↑¨'MONDAY' 'TUESDAY'          ←→ 'MO' 'TU'
  // 2 3⍴¨1 2                       ←→ (1 1)(2 2 2)
  // 4 5⍴¨"THE" "CAT"               ←→ 'THET' 'CATCA'
  // {1+⍵*2}¨2 3⍴⍳6                 ←→ 2 3⍴1 2 5 10 17 26
  '¨':adverb(function(f,g){
    assert(typeof f==='function');assert(g==null)
    return function(om,al){
      if(!al){
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(arrayEquals(al.shape,om.shape)){
        return om.map2(al, function(x, y) {
          x instanceof A||(x=new A([x],[]))
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(al.isSingleton()){
        var y=al.data[0]instanceof A?al.unwrap():al
        return om.map(function(x){
          x instanceof A||(x=new A([x],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else if(om.isSingleton()){
        var x=om.data[0]instanceof A?om.unwrap():om
        return al.map(function(y){
          y instanceof A||(y=new A([y],[]))
          var r=f(x,y);assert(r instanceof A)
          return r.shape.length?r:r.unwrap()
        })
      }else{
        lengthError()
      }
    }
  })
})
addVocabulary({
  // 1760 3 12⊤75    ←→ 2 0 3
  // 3 12⊤75         ←→ 0 3
  // 100000 12⊤75    ←→ 6 3
  // 16 16 16 16⊤100 ←→ 0 0 6 4
  // 1760 3 12⊤75.3  ←→ 2 0(75.3-72)
  // 0 1⊤75.3        ←→ 75(75.3-75)
  //
  // 2 2 2 2 2⊤1 2 3 4 5 ←→ (5 5⍴0 0 0 0 0
  // ...                         0 0 0 0 0
  // ...                         0 0 0 1 1
  // ...                         0 1 1 0 0
  // ...                         1 0 1 0 1)
  //
  // 10⊤5 15 125 ←→ 5 5 5
  // 0 10⊤5 15 125 ←→ 2 3⍴0 1 12 5 5 5
  //
  // (8 3⍴2 0 0
  // ...  2 0 0
  // ...  2 0 0
  // ...  2 0 0
  // ...  2 8 0
  // ...  2 8 0
  // ...  2 8 16
  // ...  2 8 16)⊤75
  // ... ←→ (8 3⍴0 0 0
  // ...         1 0 0
  // ...         0 0 0
  // ...         0 0 0
  // ...         1 0 0
  // ...         0 1 0
  // ...         1 1 4
  // ...         1 3 11)
  '⊤':function(om,al){
    assert(al)
    var a=al.toArray(),b=om.toArray(),shape=al.shape.concat(om.shape),data=Array(prod(shape))
    var n=al.shape.length?al.shape[0]:1,m=a.length/n
    for(var i=0;i<m;i++)for(var j=0;j<b.length;j++){
      var y=Math.abs(b[j])
      for(var k=n-1;k>=0;k--){
        var x=a[k*m+i]
        data[(k*m+i)*b.length+j]=x?y%x:y
        y=x?Math.round((y-y%x)/x):0
      }
    }
    return new A(data,shape)
  }
})
addVocabulary({
  '∊':function(om,al){
    if(al){
      // 2 3 4 5 6∊1 2 3 5 8 13 21 ←→ 1 1 0 1 0
      // 5∊1 2 3 5 8 13 21         ←→ 1
      var b=om.toArray()
      return al.map(function(x){
        for(var i=0;i<b.length;i++)if(match(x,b[i]))return 1
        return 0
      })
    }else{
      // ∊17                   ←→ ,17
      // ⍴∊(1 2 3)"ABC"(4 5 6) ←→ ,9
      // ∊2 2⍴(1+2 2⍴⍳4)"DEF"(1+2 3⍴⍳6)(7 8 9) ←→ 1 2 3 4,'DEF',1 2 3 4 5 6 7 8 9
      var r=[];enlist(om,r);return new A(r)
    }
  }
})
function enlist(x,r){x instanceof A?each(x,function(y){enlist(y,r)}):r.push(x)}
var Beta
addVocabulary({

  '!':withIdentity(1,pervasive({

    // !5    ←→ 120
    // !21   ←→ 51090942171709440000
    // !0    ←→ 1
    // !1.5  ←→ 1.3293403881791
    // !¯1.5 ←→ ¯3.544907701811
    // !¯2.5 ←→ 2.3632718012074
    // !¯200.5 ←→ 0
    // !¯1   !!! DOMAIN ERROR
    // !¯200 !!! DOMAIN ERROR
    monad:real(function(x){
      return!isInt(x)?Γ(x+1):x<0?domainError():x<smallFactorials.length?smallFactorials[x]:Math.round(Γ(x+1))
    }),

    // 2!4       ←→ 6
    // 3!20      ←→ 1140
    // 2!6 12 20 ←→ 15 66 190
    // (2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18 ←→ 2 3⍴3 15 84 495 3003 18564
    // 0.5!1     ←→ 1.2732395447351612
    // 1.2!3.4   ←→ 3.795253463731253
    // !/⍬       ←→ 1
    // (2!1000)=499500 ←→ 1
    // (998!1000)=499500 ←→ 1
    //
    //                Negative integer?  Expected
    //                   ⍺   ⍵  ⍵-⍺       Result
    //                  -----------     ----------
    // 3!5   ←→ 10  #    0   0   0      (!⍵)÷(!⍺)×!⍵-⍺
    // 5!3   ←→ 0   #    0   0   1      0
    // see below    #    0   1   0      Domain Error
    // 3!¯5  ←→ ¯35 #    0   1   1      (¯1*⍺)×⍺!⍺-⍵+1
    // ¯3!5  ←→ 0   #    1   0   0      0
    //              #    1   0   1      Cannot arise
    // ¯5!¯3 ←→ 6   #    1   1   0      (¯1*⍵-⍺)×(|⍵+1)!(|⍺+1)
    // ¯3!¯5 ←→ 0   #    1   1   1      0
    //
    // 0.5!¯1 !!! DOMAIN ERROR
    dyad:Beta=real(function(n,k){
      var r;
      switch(256*negInt(k)+16*negInt(n)+negInt(n-k)){
        case 0x000:r=Math.exp(lnΓ(n+1)-lnΓ(k+1)-lnΓ(n-k+1))            ;break
        case 0x001:r=0                                                 ;break
        case 0x010:r=domainError()                                     ;break
        case 0x011:r=Math.pow(-1,k)*Beta(k-n-1,k)                      ;break
        case 0x100:r=0                                                 ;break
        case 0x101:assert(0)                                           ;break
        case 0x110:r=Math.pow(-1,n-k)*Beta(Math.abs(k+1),Math.abs(n+1));break
        case 0x111:r=0                                                 ;break
      }
      return isInt(n)&&isInt(k)?Math.round(r):r
    })
  }))
})


function negInt(x){return isInt(x)&&x<0}
var smallFactorials=[1];(function(){var x=1;for(var i=1;i<=25;i++)smallFactorials.push(x*=i)}())

var Γ,lnΓ
;(function(){
  var g=7
  var p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
         12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7]
  var g_ln=607/128
  var p_ln=[0.99999999999999709182,57.156235665862923517,-59.597960355475491248,14.136097974741747174,
            -0.49191381609762019978,0.33994649984811888699e-4,0.46523628927048575665e-4,-0.98374475304879564677e-4,
            0.15808870322491248884e-3,-0.21026444172410488319e-3,0.21743961811521264320e-3,-0.16431810653676389022e-3,
            0.84418223983852743293e-4,-0.26190838401581408670e-4,0.36899182659531622704e-5]
  // Spouge approximation (suitable for large arguments)
  lnΓ=function(z){
    if(z<0)return NaN
    var x=p_ln[0];for(var i=p_ln.length-1;i>0;i--)x+=p_ln[i]/(z+i)
    var t=z+g_ln+.5
    return.5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z)
  }
  Γ=function(z){
    if(z<.5)return Math.PI/(Math.sin(Math.PI*z)*Γ(1-z))
    if(z>100)return Math.exp(lnΓ(z))
    z--;x=p[0];for(var i=1;i<g+2;i++)x+=p[i]/(z+i)
    t=z+g+.5
    return Math.sqrt(2*Math.PI)*Math.pow(t,z+.5)*Math.exp(-t)*x
  }
}())
addVocabulary({
  // ⍎'+/ 2 2 ⍴ 1 2 3 4'  ←→ 3 7
  // ⍴⍎'123 456'          ←→ ,2
  // ⍎'{⍵*2} ⍳5'          ←→ 0 1 4 9 16
  // ⍎'undefinedVariable' !!!
  // ⍎'1 2 (3'            !!!
  // ⍎123                 !!!
  '⍎':function(om,al){return al?nonceError():exec(om.toSimpleString())}
})
addVocabulary({
  '⍷':function(om,al){
    al||nonceError()
    // "AN"⍷"BANANA"                        ←→ 0 1 0 1 0 0
    // "BIRDS" "NEST"⍷"BIRDS" "NEST" "SOUP" ←→ 1 0 0
    // "ME"⍷"HOME AGAIN"                    ←→ 0 0 1 0 0 0 0 0 0 0
    //
    // "DAY"⍷7 9⍴("SUNDAY   ",
    // ...        "MONDAY   ",
    // ...        "TUESDAY  ",
    // ...        "WEDNESDAY",
    // ...        "THURSDAY ",
    // ...        "FRIDAY   ",
    // ...        "SATURDAY ")
    // ... ←→ (7 9⍴0 0 0 1 0 0 0 0 0
    // ...         0 0 0 1 0 0 0 0 0
    // ...         0 0 0 0 1 0 0 0 0
    // ...         0 0 0 0 0 0 1 0 0
    // ...         0 0 0 0 0 1 0 0 0
    // ...         0 0 0 1 0 0 0 0 0
    // ...         0 0 0 0 0 1 0 0 0)
    //
    // (2 2⍴"ABCD")⍷"ABCD" ←→ 4 ⍴ 0
    // (1 2)(3 4)⍷"START"(1 2 3)(1 2)(3 4) ←→ 0 0 1 0
    //
    // (2 2⍴7 8 12 13)⍷1+4 5⍴⍳20
    // ... ←→ 4 5⍴(0 0 0 0 0
    // ...         0 1 0 0 0
    // ...         0 0 0 0 0
    // ...         0 0 0 0 0)
    //
    // 1⍷⍳5                ←→ 0 1 0 0 0
    // 1 2⍷⍳5              ←→ 0 1 0 0 0
    // ⍬⍷⍳5                ←→ 1 1 1 1 1
    // ⍬⍷⍬                 ←→ ⍬
    // 1⍷⍬                 ←→ ⍬
    // 1 2 3⍷⍬             ←→ ⍬
    // (2 3 0⍴0)⍷(3 4 5⍴0) ←→ 3 4 5⍴1
    // (2 3 4⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
    // (2 3 0⍴0)⍷(3 4 0⍴0) ←→ 3 4 0⍴0
    if(al.shape.length>om.shape.length)return new A([0],om.shape,repeat([0],om.shape.length))
    if(al.shape.length < om.shape.length){
      al=new A( // prepend ones to the shape of ⍺
        al.data,
        repeat([1],om.shape.length-al.shape.length).concat(al.shape),
        repeat([0],om.shape.length-al.shape.length).concat(al.stride),
        al.offset
      )
    }
    if(al.empty())return new A([1],om.shape,repeat([0],om.shape.length))
    var findShape=[]
    for(var i=0;i<om.shape.length;i++){
      var d=om.shape[i]-al.shape[i]+1
      if(d<=0)return new A([0],om.shape,repeat([0],om.shape.length))
      findShape.push(d)
    }
    var stride=strideForShape(om.shape),data=repeat([0],prod(om.shape))
    var p=om.offset,q=0,indices=repeat([0],findShape.length)
    while(1){
      data[q]=+match(al,new A(om.data,al.shape,om.stride,p))
      var a=findShape.length-1
      while(a>=0&&indices[a]+1===findShape[a]){p-=indices[a]*om.stride[a];q-=indices[a]*stride[a];indices[a--]=0}
      if(a<0)break
      p+=om.stride[a];q+=stride[a];indices[a]++
    }
    return new A(data,om.shape)
  }
})
addVocabulary({
  '⌊':withIdentity(Infinity,pervasive({
    // ⌊123   ←→ 123
    // ⌊12.3  ←→ 12
    // ⌊¯12.3 ←→ ¯13
    // ⌊¯123  ←→ ¯123
    // ⌊'a'   !!! DOMAIN ERROR
    // ⌊12j3      ←→ 12j3
    // ⌊1.2j2.3   ←→ 1j2
    // ⌊1.2j¯2.3  ←→ 1j¯3
    // ⌊¯1.2j2.3  ←→ ¯1j2
    // ⌊¯1.2j¯2.3 ←→ ¯1j¯3
    // ⌊0 5 ¯5 (○1) ¯1.5 ←→ 0 5 ¯5 3 ¯2
    monad:Z.floor,
    // 3⌊5 ←→ 3
    // ⌊/⍬ ←→ ¯
    dyad:real(function(y,x){return Math.min(y,x)})
  })),
  '⌈':withIdentity(-Infinity,pervasive({
    // ⌈123   ←→ 123
    // ⌈12.3  ←→ 13
    // ⌈¯12.3 ←→ ¯12
    // ⌈¯123  ←→ ¯123
    // ⌈'a'   !!! DOMAIN ERROR
    // ⌈12j3      ←→ 12j3
    // ⌈1.2j2.3   ←→ 1j3
    // ⌈1.2j¯2.3  ←→ 1j¯2
    // ⌈¯1.2j2.3  ←→ ¯1j3
    // ⌈¯1.2j¯2.3 ←→ ¯1j¯2
    // ⌈0 5 ¯5(○1)¯1.5 ←→ 0 5 ¯5 4 ¯1
    monad:Z.ceil,
    // 3⌈5 ←→ 5
    // ⌈/⍬ ←→ ¯¯
    dyad:real(function(y,x){return Math.max(y,x)})
  }))
})
addVocabulary({
  // Fork: `(fgh)⍵ ← → (f⍵)g(h⍵)` ; `⍺(fgh)⍵ ← → (⍺f⍵)g(⍺h⍵)`
  //
  // (+/÷⍴)4 5 10 7 ←→ ,6.5
  //
  // a←1 ⋄ b←¯22 ⋄ c←85
  // ... √←{⍵*.5}
  // ... ((-b)(+,-)√(b*2)-4×a×c)÷2×a
  // ... ←→ 17 5
  //
  // (+,-,×,÷)2  ←→ 2 ¯2 1 .5
  // 1(+,-,×,÷)2 ←→ 3 ¯1 2 .5
  _fork1:function(h,g){
    assert(typeof h==='function')
    assert(typeof g==='function')
    return[h,g]
  },
  _fork2:function(hg,f){
    var h=hg[0],g=hg[1]
    assert(typeof h==='function')
    return function(b,a){return g(h(b,a),f(b,a))}
  }
})
addVocabulary({
  // ⍕123            ←→ 1 3⍴'123'
  // ⍕123 456        ←→ 1 7⍴'123 456'
  // ⍕123 'a'        ←→ 1 5⍴'123 a'
  // ⍕12 'ab'        ←→ 1 7⍴'12  ab '
  // ⍕1 2⍴'a'        ←→ 1 2⍴'a'
  // ⍕2 2⍴'a'        ←→ 2 2⍴'a'
  // ⍕2 2⍴5          ←→ 2 3⍴('5 5',
  // ...                     '5 5')
  // ⍕2 2⍴0 0 0 'a'  ←→ 2 3⍴('0 0',
  // ...                     '0 a')
  // ⍕2 2⍴0 0 0 'ab' ←→ 2 6⍴('0   0 ',
  // ...                     '0  ab ')
  // ⍕2 2⍴0 0 0 123  ←→ 2 5⍴('0   0',
  // ...                     '0 123')
  // ⍕4 3 ⍴ '---' '---' '---' 1 2 3 4 5 6 100 200 300
  // ...             ←→ 4 17⍴(' ---   ---   --- ',
  // ...                      '   1     2     3 ',
  // ...                      '   4     5     6 ',
  // ...                      ' 100   200   300 ')
  // ⍕1 ⍬ 2 '' 3     ←→ 1 11⍴'1    2    3'
  // ⍕∞              ←→ 1 1⍴'∞'
  // ⍕¯∞             ←→ 1 2⍴'¯∞'
  // ⍕¯1             ←→ 1 2⍴'¯1'
  // ⍕¯1e¯100J¯2e¯99 ←→ 1 14⍴'¯1e¯100J¯2e¯99'
  '⍕':function(om,al){al&&nonceError();var t=format(om);return new A(t.join(''),[t.length,t[0].length])}
})

// Format an APL object as an array of strings
function format(a){
  var t=typeof a
  if(a===null)return['null']
  if(t==='undefined')return['undefined']
  if(t==='string')return[a]
  if(t==='number'){var r=[formatNumber(a)];r.align='right';return r}
  if(t==='function')return['#procedure']
  if(!(a instanceof A))return[''+a]
  if(a.empty())return['']

  var sa=a.shape
  a=a.toArray()
  if(!sa.length)return format(a[0])
  var nRows=prod(sa.slice(0,-1))
  var nCols=sa[sa.length-1]
  var rows=[];for(var i=0;i<nRows;i++)rows.push({height:0,bottomMargin:0})
  var cols=[];for(var i=0;i<nCols;i++)cols.push({type:0,width:0,leftMargin:0,rightMargin:0}) // type:0=characters,1=numbers,2=subarrays

  var grid=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i],gridRow=[];grid.push(gridRow)
    for(var j=0;j<nCols;j++){
      var c=cols[j],x=a[nCols*i+j],box=format(x)
      r.height=Math.max(r.height,box.length)
      c.width=Math.max(c.width,box[0].length)
      c.type=Math.max(c.type,typeof x==='string'&&x.length===1?0:x instanceof A?2:1)
      gridRow.push(box)
    }
  }

  var step=1;for(var d=sa.length-2;d>0;d--){step*=sa[d];for(var i=step-1;i<nRows-1;i+=step)rows[i].bottomMargin++}

  for(var j=0;j<nCols;j++){
    var c=cols[j]
    if(j<nCols-1&&(c.type!==cols[j+1].type||c.type))c.rightMargin++
    if(c.type===2){c.leftMargin++;c.rightMargin++}
  }

  var result=[]
  for(var i=0;i<nRows;i++){
    var r=rows[i]
    for(var j=0;j<nCols;j++){
      var c=cols[j]
      var t=grid[i][j]
      var left =repeat(' ',c.leftMargin +(t.align==='right')*(c.width-t[0].length))
      var right=repeat(' ',c.rightMargin+(t.align!=='right')*(c.width-t[0].length))
      for(var k=0;k<t.length;k++)t[k]=left+t[k]+right
      var bottom=repeat(' ',t[0].length)
      for(var h=r.height+r.bottomMargin-t.length;h>0;h--)t.push(bottom)
    }
    var nk=r.height+r.bottomMargin
    for(var k=0;k<nk;k++){
      var s='';for(var j=0;j<nCols;j++)s+=grid[i][j][k]
      result.push(s)
    }
  }
  return result
}
addVocabulary({
  // ⍋13 8 122 4                  ←→ 3 1 0 2
  // a←13 8 122 4 ⋄ a[⍋a]         ←→ 4 8 13 122
  // ⍋"ZAMBIA"                    ←→ 1 5 3 4 2 0
  // s←"ZAMBIA" ⋄ s[⍋s]           ←→ 'AABIMZ'
  // t←3 3⍴"BOBALFZAK" ⋄ ⍋t       ←→ 1 0 2
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ ⍋t ←→ 2 1 0
  //
  // t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ t[⍋t;]
  // ...    ←→ (3 3⍴ 1 1 2
  // ...              1 1 3
  // ...              4 5 6)
  //
  // a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12 ⋄ a[⍋a;;]
  // ... ←→ (3 2 3⍴ 1  1  2
  // ...           10 11 12
  // ...
  // ...            1  1  3
  // ...            4  5  6
  // ...
  // ...            2  3  4
  // ...            0  1  0)
  //
  // a←3 2 5⍴"joe  doe  bob  jonesbob  zwart"  ⋄  a[⍋a;;]
  // ... ←→ 3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '
  //
  // "ZYXWVUTSRQPONMLKJIHGFEDCBA"⍋"ZAMBIA" ←→ 0 2 4 3 1 5
  // ⎕A←"ABCDEFGHIJKLMNOPQRSTUVWXYZ" ⋄ (⌽⎕A)⍋3 3⍴"BOBALFZAK" ←→ 2 0 1
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll←2 26⍴"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  // ... data[coll⍋data;]
  // ...   ←→ 6 4⍴'ABELaBELABLEaBLEACESACRE'
  //
  // data←6 4⍴"ABLEaBLEACREABELaBELACES"
  // ... coll1←"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
  // ... data[coll1⍋data;]
  // ...   ←→ 6 4⍴'ABELABLEACESACREaBELaBLE'
  //
  // ⍋0 1 2 3 4 3 6 6 4 9 1 11 12 13 14 15 ←→ 0 1 10 2 3 5 4 8 6 7 9 11 12 13 14 15
  '⍋':function(om,al){return grade(om,al,1)},

  // ⍒3 1 8 ←→ 2 0 1
  '⍒':function(om,al){return grade(om,al,-1)}
})

// Helper for ⍋ and ⍒
function grade(om,al,direction){
  var h={} // maps a character to its index in the collation
  if(al){
    al.shape.length||rankError()
    each(al,function(x,indices){typeof x==='string'||domainError();h[x]=indices[indices.length-1]})
  }
  om.shape.length||rankError()
  var r=[];for(var i=0;i<om.shape[0];i++)r.push(i)
  return new A(r.sort(function(i,j){
    var p=om.offset,indices=repeat([0],om.shape.length)
    while(1){
      var x=om.data[p+i*om.stride[0]],tx=typeof x
      var y=om.data[p+j*om.stride[0]],ty=typeof y
      if(tx<ty)return-direction
      if(tx>ty)return direction
      if(h[x]!=null)x=h[x]
      if(h[y]!=null)y=h[y]
      if(x<y)return-direction
      if(x>y)return direction
      var a=indices.length-1
      while(a>0&&indices[a]+1===om.shape[a]){p-=om.stride[a]*indices[a];indices[a--]=0}
      if(a<=0)break
      p+=om.stride[a];indices[a]++
    }
    return(i>j)-(i<j)
  }))
}
addVocabulary({
  // f←{⍺+2×⍵} ⋄ f/⍬           !!! DOMAIN ERROR
  // f←{⍺+2×⍵} ⋄ (f⍁123)/⍬     ←→ 123
  // f←{⍺+2×⍵} ⋄ (456⍁f)/⍬     ←→ 456
  // f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬ !!! DOMAIN ERROR
  // {}⍁1 2                    !!! RANK ERROR
  // ({}⍁(1 1 1⍴123))/⍬        ←→ 123
  '⍁':conjunction(function(f,x){
    if(f instanceof A){var h=f;f=x;x=h}
    assert(typeof f==='function')
    assert(x instanceof A)
    x.isSingleton()||rankError()
    if(x.shape.length)x=A.scalar(x.unwrap())
    return withIdentity(x,function(om,al,axis){return f(om,al,axis)})
  })
})
addVocabulary({
  '⍳':function(om,al){
    if(al){
      // 2 5 9 14 20⍳9                           ←→ 2
      // 2 5 9 14 20⍳6                           ←→ 5
      // "GORSUCH"⍳"S"                           ←→ 3
      // "ABCDEFGHIJKLMNOPQRSTUVWXYZ"⍳"CARP"     ←→ 2 0 17 15
      // "ABCDEFGHIJKLMNOPQRSTUVWXYZ"⍳"PORK PIE" ←→ 15 14 17 10 26 15 8 4
      // "MON" "TUES" "WED"⍳"MON" "THURS"        ←→ 0 3
      // 1 3 2 0 3⍳⍳5                            ←→ 3 0 2 1 5
      // "CAT" "DOG" "MOUSE"⍳"DOG" "BIRD"        ←→ 1 3
      // 123⍳123                                 !!! RANK ERROR
      // (2 2⍴123)⍳123                           !!! RANK ERROR
      // 123 123⍳123                             ←→ 0
      // ⍬⍳123 234                               ←→ 0 0
      // 123 234⍳⍬                               ←→ ⍬
      al.shape.length===1||rankError()
      return om.map(function(x){
        var rank=al.shape
        try{each(al,function(y,indices){if(match(x,y)){rank=indices;throw'break'}})}
        catch(e){if(e!=='break')throw e}
        return rank.length===1?rank[0]:new A(rank)
      })
    }else{
      // ⍳5     ←→ 0 1 2 3 4
      // ⍴⍳5    ←→ 1 ⍴ 5
      // ⍳0     ←→ ⍬
      // ⍴⍳0    ←→ ,0
      // ⍳2 3 4 ←→ (2 3 4⍴(0 0 0)(0 0 1)(0 0 2)(0 0 3)
      // ...              (0 1 0)(0 1 1)(0 1 2)(0 1 3)
      // ...              (0 2 0)(0 2 1)(0 2 2)(0 2 3)
      // ...              (1 0 0)(1 0 1)(1 0 2)(1 0 3)
      // ...              (1 1 0)(1 1 1)(1 1 2)(1 1 3)
      // ...              (1 2 0)(1 2 1)(1 2 2)(1 2 3))
      // ⍴⍳2 3 4 ←→ 2 3 4
      // ⍳¯1 !!! DOMAIN ERROR
      om.shape.length<=1||rankError()
      var a=om.toArray();for(var i=0;i<a.length;i++)isInt(a[i],0)||domainError()
      var n=prod(a),data
      if(!n){
        data=[]
      }else if(a.length===1){
        data=n<=0x100      ?new Uint8Array (n):
             n<=0x10000    ?new Uint16Array(n):
             n<=0x100000000?new Uint32Array(n):
             domainError()
        for(var i=0;i<n;i++)data[i]=i
      }else{
        var m=Math.max.apply(Math,a)
        var ctor=m<=0x100      ?Uint8Array :
                 m<=0x10000    ?Uint16Array:
                 m<=0x100000000?Uint32Array:
                 domainError()
        var itemData=new ctor(n*a.length)
        var u=n
        for(var i=0;i<a.length;i++){
          u/=a[i];p=n*i
          for(var j=0;j<a[i];j++){itemData[p]=j;spread(itemData,p,1,u);p+=u}
          spread(itemData,n*i,a[i]*u,n)
        }
        data=[]
        var itemShape=[a.length],itemStride=[n]
        for(var i=0;i<n;i++)data.push(new A(itemData,itemShape,itemStride,i))
      }
      return new A(data,a)
    }
  }
})
addVocabulary({
  // ⍴⊂2 3⍴⍳6      ←→ ⍬
  // ⍴⍴⊂2 3⍴⍳6     ←→ ,0
  // ⊂[0]2 3⍴⍳6    ←→ (0 3)(1 4)(2 5)
  // ⍴⊂[0]2 3⍴⍳6   ←→ ,3
  // ⊂[1]2 3⍴⍳6    ←→ (0 1 2)(3 4 5)
  // ⍴⊂[1]2 3⍴⍳6   ←→ ,2
  // ⊃⊂[1 0]2 3⍴⍳6 ←→ 3 2⍴0 3 1 4 2 5
  // ⍴⊂[1 0]2 3⍴⍳6 ←→ ⍬
  // ⍴⊃⊂⊂1 2 3     ←→ ⍬
  '⊂':function(om,al,axes){
    assert(!al)
    if(axes==null){
      axes=[];for(var i=0;i<om.shape.length;i++)axes.push(i)
    }else{
      axes=getAxisList(axes,om.shape.length)
    }
    if(om.isSimple())return om
    var unitShape =axes.map(function(k){return om.shape [k]})
    var unitStride=axes.map(function(k){return om.stride[k]})
    var resultAxes=[];for(var k=0;k<om.shape.length;k++)axes.indexOf(k)<0&&resultAxes.push(k)
    var shape =resultAxes.map(function(k){return om.shape [k]})
    var stride=resultAxes.map(function(k){return om.stride[k]})
    var data=[]
    each(new A(om.data,shape,stride,om.offset),function(x,indices,p){data.push(new A(om.data,unitShape,unitStride,p))})
    return new A(data,shape)
  }
})
addVocabulary({
  '~': pervasive({
    // ~0 1 ←→ 1 0
    // ~2   !!! DOMAIN ERROR
    monad:function(x){return+!bool(x)}
  }),
  '∨':withIdentity(0,pervasive({
    // 1∨1               ←→ 1
    // 1∨0               ←→ 1
    // 0∨1               ←→ 1
    // 0∨0               ←→ 0
    // 0 0 1 1 ∨ 0 1 0 1 ←→ 0 1 1 1
    // 12∨18             ←→ 6 ⍝ 12=2×2×3, 18=2×3×3
    // 299∨323           ←→ 1 ⍝ 299=13×23, 323=17×19
    // 12345∨12345       ←→ 12345
    // 0∨123             ←→ 123
    // 123∨0             ←→ 123
    // ∨/⍬               ←→ 0
    // ¯12∨18            ←→ 6
    // 12∨¯18            ←→ 6
    // ¯12∨¯18           ←→ 6
    // 1.5∨2.5           !!! DOMAIN ERROR
    // 'a'∨1             !!! DOMAIN ERROR
    // 1∨'a'             !!! DOMAIN ERROR
    // 'a'∨'b'           !!! DOMAIN ERROR
    // 135j¯14∨155j34    ←→ 5j12
    // 2 3 4∨0j1 1j2 2j3 ←→ 1 1 1
    // 2j2 2j4∨5j5 4j4   ←→ 1j1 2
    dyad:function(y,x){
      if(!Z.isint(x)||!Z.isint(y))domainError('∨ is implemented only for Gaussian integers')
      return Z.gcd(x,y)
    }
  })),
  '∧':withIdentity(1,pervasive({
    // 1∧1                            ←→ 1
    // 1∧0                            ←→ 0
    // 0∧1                            ←→ 0
    // 0∧0                            ←→ 0
    // 0 0 1 1∧0 1 0 1                ←→ 0 0 0 1
    // 0 0 0 1 1∧1 1 1 1 0            ←→ 0 0 0 1 0
    // t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ 1∧t  ←→ 3 3 ⍴ 1 1 1 0 0 0 1 0 1
    // t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ ∧/t  ←→ 1 0 0
    // 12∧18   # 12=2×2×3, 18=2×3×3   ←→ 36
    // 299∧323 # 299=13×23, 323=17×19 ←→ 96577
    // 12345∧12345                    ←→ 12345
    // 0∧123                          ←→ 0
    // 123∧0                          ←→ 0
    // ∧/⍬                            ←→ 1
    // ¯12∧18                         ←→ ¯36
    // 12∧¯18                         ←→ ¯36
    // ¯12∧¯18                        ←→ 36
    // 1.5∧2.5                        !!! DOMAIN ERROR
    // 'a'∧1                          !!! DOMAIN ERROR
    // 1∧'a'                          !!! DOMAIN ERROR
    // 'a'∧'b'                        !!! DOMAIN ERROR
    // 135j¯14∧155j34                 ←→ 805j¯1448
    // 2 3 4∧0j1 1j2 2j3              ←→ 0j2 3j6 8j12
    // 2j2 2j4∧5j5 4j4                ←→ 10j10 ¯4j12
    dyad:function(y,x){
      if(!Z.isint(x)||!Z.isint(y))domainError('∧ is implemented only for Gaussian integers')
      return Z.lcm(x,y)
    }
  })),
  // 0⍱0 ←→ 1
  // 0⍱1 ←→ 0
  // 1⍱0 ←→ 0
  // 1⍱1 ←→ 0
  // 0⍱2 !!! DOMAIN ERROR
  '⍱':pervasive({dyad:real(function(y,x){return+!(bool(x)|bool(y))})}),
  // 0⍲0 ←→ 1
  // 0⍲1 ←→ 1
  // 1⍲0 ←→ 1
  // 1⍲1 ←→ 0
  // 0⍲2 !!! DOMAIN ERROR
  '⍲':pervasive({dyad:real(function(y,x){return+!(bool(x)&bool(y))})})
})
addVocabulary({
  // ({⍵+1}⍣5) 3 ←→ 8
  // ({⍵+1}⍣0) 3 ←→ 3
  // (⍴⍣3)2 2⍴⍳4 ←→ ,1
  // 'a'(,⍣3)'b' ←→ 'aaab'
  // 1{⍺+÷⍵}⍣=1 ←→ 1.618033988749895
  // c←0 ⋄ 5⍣{c←c+1}0 ⋄ c ←→ 5
  '⍣':conjunction(function(g,f){
    if(f instanceof A&&typeof g==='function'){var h=f;f=g;g=h}else{assert(typeof f==='function')}
    if(typeof g==='function'){
      return function(om,al){
        while(1){
          var om1=f(om,al)
          if(g(om,om1).toBool())return om
          om=om1
        }
      }
    }else{
      var n=g.toInt(0)
      return function(om,al){
        for(var i=0;i<n;i++)om=f(om,al)
        return om
      }
    }
  })
})
addVocabulary({
  'get_⎕':cps(function(_,_1,_2,callback){
    if(typeof window!=='undefined'&&typeof window.prompt==='function'){
      setTimeout(function(){callback(exec(prompt('⎕:')||''))},0)
    }else{
      process.stdout.write('⎕:\n')
      readline('      ',function(line){callback(exec(new A(line).toSimpleString()))})
    }
  }),
  'set_⎕': function(x) {
    var s=format(x).join('\n')+'\n'
    if(typeof window!=='undefined'&&typeof window.alert==='function'){window.alert(s)}else{process.stdout.write(s)}
    return x
  },
  'get_⍞':cps(function(_,_1,_2,callback){
    if(typeof window!=='undefined'&&typeof window.prompt==='function'){
      setTimeout(function(){callback(new A(prompt('')||''))},0)
    }else{
      readline('',function(line){callback(new A(line))})
    }
  }),
  'set_⍞':function(x){
    var s=format(x).join('\n')
    if(typeof window!=='undefined'&&typeof window.alert==='function'){window.alert(s)}else{process.stdout.write(s)}
    return x
  },
  // The index origin is fixed at 0.  Reading it returns 0.  Attempts to set it
  // to anything other than that fail.
  //
  // ⎕IO   ←→ 0
  // ⎕IO←0 ←→ 0
  // ⎕IO←1 !!!
  'get_⎕IO':function(){return A.zero},
  'set_⎕IO':function(x){if(match(x,A.zero)){return x}else{domainError('The index origin (⎕IO) is fixed at 0')}},
  '⎕DL':cps(function(om,al,_,callback){
    var t0=+new Date;setTimeout(function(){callback(new A([new Date-t0]))},om.unwrap())
  }),
  // 'b(c+)d'⎕RE'abcd' ←→ 1 'bcd' (,'c')
  // 'B(c+)d'⎕RE'abcd' ←→ ⍬
  // 'a(b'   ⎕RE'c'           !!! DOMAIN ERROR
  '⎕RE':function(om,al){
    var x=al.toSimpleString(),y=om.toSimpleString()
    try{var re=RegExp(x)}catch(e){domainError(e.toString())}
    var m=re.exec(y)
    if(!m)return A.zilde
    var r=[m.index];for(var i=0;i<m.length;i++)r.push(new A(m[i]||''))
    return new A(r)
  },
  // ⎕UCS'a' ←→ 97
  // ⎕UCS'ab' ←→ 97 98
  // ⎕UCS 2 2⍴97+⍳4 ←→ 2 2⍴'abcd'
  '⎕UCS':function(om,al){
    al&&nonceError()
    return om.map(function(x){
      return isInt(x,0,0x10000)?String.fromCharCode(x):typeof x==='string'?x.charCodeAt(0):domainError()
    })
  },
  'get_⎕OFF':function(){typeof process==='undefined'&&nonceError();process.exit(0)}
})
addVocabulary({
  '?':function(om,al){return al?deal(om,al):roll(om)}
})

// n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n) ←→ 1
// ?0   !!! DOMAIN ERROR
// ?1   ←→ 0
// ?1.5 !!! DOMAIN ERROR
// ?'a' !!! DOMAIN ERROR
// ?1j2 !!! DOMAIN ERROR
// ?∞   !!! DOMAIN ERROR
var roll=pervasive({monad:function(om){isInt(om,1)||domainError();return Math.floor(Math.random()*om)}})

// n←100 ⋄ (+/n?n)=(+/⍳n) ←→ 1 # a permutation (an "n?n" dealing) contains all 0...n
// n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n ←→ 1 # any number x in a dealing is 0 <= x < n
// 0?100 ←→ ⍬
// 0?0   ←→ ⍬
// 1?1   ←→ ,0
// 1?1 1 !!! LENGTH ERROR
// 5?3   !!! DOMAIN ERROR
// ¯1?3  !!! DOMAIN ERROR
function deal(om,al){
  al=al.unwrap();om=om.unwrap()
  isInt(om,0)&&isInt(al,0,om+1)||domainError()
  var r=Array(om);for(var i=0;i<om;i++)r[i]=i
  for(var i=0;i<al;i++){var j=i+Math.floor(Math.random()*(om-i));h=r[i];r[i]=r[j];r[j]=h}
  return new A(r.slice(0,al))
}
addVocabulary({
  // ↗'CUSTOM ERROR' !!! CUSTOM ERROR
  '↗':function(om){aplError(om.toString())}
})
addVocabulary({
  '⍴':function(om,al){
    if(al){
      // ⍴1 2 3⍴0  ←→ 1 2 3
      // ⍴⍴1 2 3⍴0 ←→ ,3
      // 3 3⍴⍳4    ←→ 3 3⍴0 1 2 3 0 1 2 3 0
      // ⍴3 3⍴⍳4   ←→ 3 3
      // ⍬⍴123     ←→ 123
      // ⍬⍴⍬       ←→ 0
      // 2 3⍴⍬     ←→ 2 3⍴0
      // 2 3⍴⍳7    ←→ 2 3⍴0 1 2 3 4 5
      // ⍴1e9⍴0    ←→ ,1e9
      al.shape.length<=1||rankError()
      var a=al.toArray(),n=prod(a)
      for(var i=0;i<a.length;i++)isInt(a[i],0)||domainError
      if(!n){
        return new A([],a)
      }else if(a.length>=om.shape.length&&arrayEquals(om.shape,a.slice(a.length-om.shape.length))){
        // If ⍺ is only prepending axes to ⍴⍵, we can reuse the .data array
        return new A(om.data,a,repeat([0],a.length-om.shape.length).concat(om.stride),om.offset)
      }else{
        var data=[]
        try{
          each(om,function(x){
            if(data.length>=n)throw'break'
            data.push(x)
          })
        }catch(e){
          if(e!=='break')throw e
        }
        if(data.length){
          while(2*data.length<n)data=data.concat(data)
          if(data.length!==n)data=data.concat(data.slice(0,n-data.length))
        }else{
          data=repeat([om.getPrototype()],n)
        }
        return new A(data,a)
      }
    }else{
      // ⍴0       ←→ 0⍴0
      // ⍴0 0     ←→ 1⍴2
      // ⍴⍴0      ←→ 1⍴0
      // ⍴⍴⍴0     ←→ 1⍴1
      // ⍴⍴⍴0 0   ←→ 1⍴1
      // ⍴'a'     ←→ 0⍴0
      // ⍴'ab'    ←→ 1⍴2
      // ⍴2 3 4⍴0 ←→ 2 3 4
      return new A(om.shape)
    }
  }
})
var rotate
addVocabulary({
  '⌽': rotate = function(om, al, axis) {
    assert(typeof axis==='undefined'||axis instanceof A)
    if(al){
      // 1⌽1 2 3 4 5 6             ←→ 2 3 4 5 6 1
      // 3⌽'ABCDEFGH'              ←→ 'DEFGHABC'
      // 3⌽2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴4 5 1 2 3 9 0 6 7 8
      // ¯2⌽"ABCDEFGH"             ←→ 'GHABCDEF'
      // 1⌽3 3⍴⍳9                  ←→ 3 3⍴1 2 0 4 5 3 7 8 6
      // 0⌽1 2 3 4                 ←→ 1 2 3 4
      // 0⌽1234                    ←→ 1234
      // 5⌽⍬                       ←→ ⍬
      axis=axis?axis.unwrap():om.shape.length-1 
      isInt(axis)||domainError()
      if(om.shape.length&&!(0<=axis&&axis<om.shape.length))indexError()
      var step=al.unwrap()
      isInt(step)||domainError()
      if(!step)return om
      var n=om.shape[axis]
      step=(n+step%n)%n // force % to handle negatives properly
      if(om.empty()||!step)return om
      var data=[],shape=om.shape,stride=om.stride,p=om.offset,indices=repeat([0],shape.length)
      while(1){
        data.push(om.data[p+((indices[axis]+step)%shape[axis]-indices[axis])*stride[axis]])
        var a=shape.length-1
        while(a>=0&&indices[a]+1===shape[a]){p-=indices[a]*stride[a];indices[a--]=0}
        if(a<0)break
        indices[a]++;p+=stride[a]
      }
      return new A(data,shape)
    }else{
      // ⌽1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
      // ⌽(1 2)(3 4)(5 6)             ←→ (5 6)(3 4)(1 2)
      // ⌽"BOB WON POTS"              ←→ 'STOP NOW BOB'
      // ⌽    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
      // ⌽[0] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
      if(axis){
        axis.isSingleton()||lengthError()
        axis=axis.unwrap()
        isInt(axis)||domainError()
        0<=axis&&axis<om.shape.length||indexError()
      }else{
        axis=[om.shape.length-1]
      }
      if(!om.shape.length)return om
      var stride=om.stride.slice(0);stride[axis]=-stride[axis]
      var offset=om.offset+(om.shape[axis]-1)*om.stride[axis]
      return new A(om.data,om.shape,stride,offset)
    }
  },
  // ⊖1 2 3 4 5 6                 ←→ 6 5 4 3 2 1
  // ⊖(1 2) (3 4) (5 6)           ←→ (5 6)(3 4)(1 2)
  // ⊖'BOB WON POTS'              ←→ 'STOP NOW BOB'
  // ⊖    2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴6 7 8 9 0 1 2 3 4 5
  // ⊖[1] 2 5⍴1 2 3 4 5 6 7 8 9 0 ←→ 2 5⍴5 4 3 2 1 0 9 8 7 6
  // 1⊖3 3⍴⍳9 ←→ 3 3⍴3 4 5 6 7 8 0 1 2
  '⊖':function(om,al,axis){return rotate(om,al,axis||A.zero)}
})
var reduce
addVocabulary({
  '⌿':adverb(function(om,al,axis){return reduce(om,al,axis||A.zero)}),
  '/':reduce=adverb(function(om,al,axis){
    if(typeof om==='function'){
      // +/3                    ←→ 3
      // +/3 5 8                ←→ 16
      // ⌈/82 66 93 13          ←→ 93
      // ×/2 3⍴1 2 3 4 5 6      ←→ 6 120
      // 2,/'ab' 'cd' 'ef' 'hi' ←→ 'abcd' 'cdef' 'efhi'
      // 3,/'ab' 'cd' 'ef' 'hi' ←→ 'abcdef' 'cdefhi'
      // -/3 0⍴42               ←→ 3⍴0
      // 2+/1+⍳10    ←→ 3 5 7 9 11 13 15 17 19
      // 5+/1+⍳10    ←→ 15 20 25 30 35 40
      // 10+/1+⍳10   ←→ ,55
      // 11+/1+⍳10   ←→ ⍬
      // 12+/1+⍳10   !!! LENGTH ERROR
      // 2-/3 4 9 7  ←→ ¯1 ¯5 2
      // ¯2-/3 4 9 7 ←→ 1 5 ¯2
      var f=om,g=al,axis0=axis
      assert(typeof f==='function')
      assert(typeof g==='undefined')
      assert(typeof axis0==='undefined'||axis0 instanceof A)
      return function(om, al){
        if(!om.shape.length)om=new A([om.unwrap()])
        axis=axis0?axis0.toInt():om.shape.length-1
        0<=axis&&axis<om.shape.length||rankError()
        var n,isNWise,isBackwards
        if(al){isNWise=1;n=al.toInt();if(n<0){isBackwards=1;n=-n}}else{n=om.shape[axis]}

        var shape=om.shape.slice(0);shape[axis]=om.shape[axis]-n+1
        var rShape=shape
        if(isNWise){
          if(!shape[axis])return new A([],rShape)
          shape[axis]>=0||lengthError()
        }else{
          rShape=rShape.slice(0);rShape.splice(axis,1)
        }

        if(om.empty()){
          var z=f.identity;z!=null||domainError();assert(!z.shape.length)
          return new A(z.data,rShape,repeat([0],rShape.length),z.offset)
        }

        var data=[],indices=repeat([0],shape.length),p=om.offset
        while(1){
          if(isBackwards){
            var x=om.data[p];x instanceof A||(x=A.scalar(x))
            for(var i=1;i<n;i++){
              var y=om.data[p+i*om.stride[axis]];y instanceof A||(y=A.scalar(y))
              x=f(x,y)
            }
          }else{
            var x=om.data[p+(n-1)*om.stride[axis]];x instanceof A||(x=A.scalar(x))
            for(var i=n-2;i>=0;i--){
              var y=om.data[p+i*om.stride[axis]];y instanceof A||(y=A.scalar(y))
              x=f(x,y)
            }
          }
          x.shape.length||(x=x.unwrap())
          data.push(x)
          var a=indices.length-1
          while(a>=0&&indices[a]+1===shape[a]){p-=indices[a]*om.stride[a];indices[a--]=0}
          if(a<0)break
          p+=om.stride[a];indices[a]++
        }
        return new A(data,rShape)
      }
    }else{
      // 0 1 0 1/'abcd'                   ←→ 'bd'
      // 1 1 1 1 0/12 14 16 18 20         ←→ 12 14 16 18
      // m←45 60 33 50 66 19 ⋄ (m≥50)/m   ←→ 60 50 66
      // m←45 60 33 50 66 19 ⋄ (m=50)/⍳≢m ←→ ,3
      // 1/'ab'                           ←→ 'ab'
      // 0/'ab'                           ←→ ⍬
      // 0 1 0/ 1+2 3⍴⍳6                  ←→ 2 1⍴2 5
      // 1 0/[0]1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      // 1 0⌿   1+2 3⍴⍳6                  ←→ 1 3⍴1 2 3
      // 3/5                              ←→ 5 5 5
      // 2 ¯2 2/1+2 3⍴⍳6           ←→ 2 6⍴  1 1 0 0 3 3  4 4 0 0 6 6
      // 1 1 ¯2 1 1/1 2(2 2⍴⍳4)3 4 ←→ 1 2 0 0 3 4
      // 2 3 2/'abc'               ←→ 'aabbbcc'
      // 2/'def'                   ←→ 'ddeeff'
      // 5 0 5/1 2 3               ←→ 1 1 1 1 1 3 3 3 3 3
      // 2/1+2 3⍴⍳6                ←→ 2 6⍴ 1 1 2 2 3 3  4 4 5 5 6 6
      // 2⌿1+2 3⍴⍳6                ←→ 4 3⍴ 1 2 3  1 2 3  4 5 6  4 5 6
      // 2 3/3 1⍴'abc'             ←→ 3 5⍴'aaaaabbbbbccccc'
      // 2 ¯1 2/[1]3 1⍴7 8 9       ←→ 3 5⍴7 7 0 7 7 8 8 0 8 8 9 9 0 9 9
      // 2 ¯1 2/[1]3 1⍴'abc'       ←→ 3 5⍴'aa aabb bbcc cc'
      // 2 ¯2 2/7                  ←→ 7 7 0 0 7 7
      om.shape.length||(om=new A([om.unwrap()]))
      axis=axis?axis.toInt(0,om.shape.length):om.shape.length-1
      al.shape.length<=1||rankError()
      var a=al.toArray(),n=om.shape[axis]
      if(a.length===1)a=repeat(a,n)
      if(n!==1&&n!==a.length)lengthError()

      var shape=om.shape.slice(0);shape[axis]=0
      var b=[]
      for(var i=0;i<a.length;i++){
        var x=a[i]
        isInt(x)||domainError()
        shape[axis]+=Math.abs(x)
        var nj=Math.abs(x);for(var j=0;j<nj;j++)b.push(x>0?i:null)
      }
      if(n===1)for(var i=0;i<b.length;i++)b[i]=b[i]==null?b[i]:0

      var data=[]
      if(shape[axis]&&!om.empty()){
        var filler=om.getPrototype(),p=om.offset,indices=repeat([0],shape.length)
        while(1){
          data.push(b[indices[axis]]==null?filler:om.data[p+b[indices[axis]]*om.stride[axis]])
          var i=shape.length-1
          while(i>=0&&indices[i]+1===shape[i]){
            if(i!==axis)p-=om.stride[i]*indices[i]
            indices[i--]=0
          }
          if(i<0)break
          if(i!==axis)p+=om.stride[i]
          indices[i]++
        }
      }
      return new A(data,shape)
    }
  })
})
var squish
addVocabulary({
  // "a0 a1...⌷b" is equivalent to "b[a0;a1;...]"
  //
  // 1⌷3 5 8                ←→ 5
  // (3 5 8)[1]             ←→ 5
  // (3 5 8)[⍬]             ←→ ⍬
  // (2 2 0)(1 2)⌷3 3⍴⍳9    ←→ 3 2⍴7 8 7 8 1 2
  // ¯1⌷3 5 8               !!! INDEX ERROR
  // 2⌷111 222 333 444      ←→ 333
  // (⊂3 2)⌷111 222 333 444 ←→ 444 333
  // (⊂2 3⍴2 0 3 0 1 2)⌷111 222 333 444 ←→ 2 3⍴333 111 444 111 222 333
  // 1 0   ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21
  // 1     ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 22 23 24
  // 2(1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 32 31
  // (1 2)0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34 ←→ 21 31
  // a←2 2⍴0 ⋄ a[;0]←1 ⋄ a ←→ 2 2⍴1 0 1 0
  // a←2 3⍴0 ⋄ a[1;0 2]←1 ⋄ a ←→ 2 3⍴0 0 0 1 0 1
  '⌷':squish=function(om,al,axes){
    if(typeof om==='function')return function(x,y){return om(x,y,al)}
    al||nonceError()
    al.shape.length>1&&rankError()
    var a=al.toArray();a.length>om.shape.length&&lengthError()

    if(axes){
      axes=axes.toArray()
      a.length===axes.length||lengthError()
      var h=Array(om.shape.length)
      for(var i=0;i<axes.length;i++){
        var axis=axes[i]
        isInt(axis)||domainError()
        0<=axis&&axis<om.shape.length||rankError()
        h[axis]&&rankError('Duplicate axis')
        h[axis]=1
      }
    }else{
      axes=[];for(var i=0;i<a.length;i++)axes.push(i)
    }

    var r=om
    for(var i=a.length-1;i>=0;i--){
      var u=a[i]instanceof A?a[i]:new A([a[i]],[])
      r=indexAtSingleAxis(r,u,axes[i])
    }
    return r
  },

  // (23 54 38)[0]                       ←→ 23
  // (23 54 38)[1]                       ←→ 54
  // (23 54 38)[2]                       ←→ 38
  // (23 54 38)[3]                       !!! INDEX ERROR
  // (23 54 38)[¯1]                      !!! INDEX ERROR
  // (23 54 38)[0 2]                     ←→ 23 38
  // (2 3⍴100 101 102 110 111 112)[1;2]  ←→ 112
  // (2 3⍴100 101 102 110 111 112)[1;¯1] !!! INDEX ERROR
  // (2 3⍴100 101 102 110 111 112)[10;1] !!! INDEX ERROR
  // (2 3⍴100 101 102 110 111 112)[1;]   ←→ 110 111 112
  // (2 3⍴100 101 102 110 111 112)[;1]   ←→ 101 111
  // 'hello'[1]                          ←→ 'e'
  // 'ipodlover'[1 2 5 8 3 7 6 0 4]      ←→ 'poordevil'
  // ('axlrose'[4 3 0 2 5 6 1])[0 1 2 3] ←→ 'oral'
  // (1 2 3)[⍬]                          ←→ ⍬
  // ⍴(1 2 3)[1 2 3 0 5⍴0]               ←→ 1 2 3 0 5
  // (⍳3)[]                              ←→ ⍳3
  // ⍴(3 3⍴⍳9)[⍬;⍬]                      ←→ 0 0
  //
  // " X"[(3 3⍴⍳9)∊1 3 6 7 8] ←→ 3 3⍴(' X ',
  // ...                              'X  ',
  // ...                              'XXX')
  _index:function(alphaAndAxes,om){
    var h=alphaAndAxes.toArray(),al=h[0],axes=h[1]
    return squish(om,al,axes)
  },

  // a←⍳5 ⋄ a[1 3]←7 8 ⋄ a ←→ 0 7 2 8 4
  // a←⍳5 ⋄ a[1 3]←7   ⋄ a ←→ 0 7 2 7 4
  // a←⍳5 ⋄ a[1]  ←7 8 ⋄ a !!! RANK ERROR
  // a←1 2 3 ⋄ a[1]←4 ⋄ a ←→ 1 4 3
  // a←2 2⍴⍳4 ⋄ a[0;0]←4 ⋄ a ←→ 2 2⍴4 1 2 3
  // a←5 5⍴0 ⋄ a[1 3;2 4]←2 2⍴1+⍳4 ⋄ a ←→ 5 5⍴(0 0 0 0 0
  // ...                                       0 0 1 0 2
  // ...                                       0 0 0 0 0
  // ...                                       0 0 3 0 4
  // ...                                       0 0 0 0 0)
  // a←'this is a test' ⋄ a[0 5]←'TI' ←→ 'This Is a test'
  // Data←0 4 8 ⋄ 10+ (Data[0 2]← 7 9) ←→ 17 14 19
  // a←3 4⍴⍳12 ⋄ a[;1 2]←99 ←→ 3 4⍴0 99 99 3 4 99 99 7 8 99 99 11
  // a←1 2 3 ⋄ a[⍬]←4 ⋄ a ←→ 1 2 3
  // a←3 3⍴⍳9 ⋄ a[⍬;1 2]←789 ⋄ a ←→ 3 3⍴⍳9
  // a←1 2 3 ⋄ a[]←4 5 6 ⋄ a ←→ 4 5 6
  _substitute:function(args){
    var h=args.toArray().map(function(x){return x instanceof A?x:new A([x],[])})
    var value=h[0],al=h[1],om=h[2],axes=h[3]

    al.shape.length>1&&rankError()
    var a=al.toArray();a.length>om.shape.length&&lengthError()

    if(axes){
      axes.shape.length>1&&rankError()
      axes=axes.toArray()
      a.length===axes.length||lengthError()
    }else{
      axes=[];for(var i=0;i<a.length;i++)a.push(i)
    }

    var subs=squish(vocabulary['⍳'](new A(om.shape)),al,new A(axes))
    if(value.isSingleton())value=new A([value],subs.shape,repeat([0],subs.shape.length))
    var data=om.toArray(),stride=strideForShape(om.shape)
    each2(subs,value,function(u,v){
      if(v instanceof A&&!v.shape.length)v=v.unwrap()
      if(u instanceof A){
        var p=0,ua=u.toArray()
        for(var i=0;i<ua.length;i++)p+=ua[i]*stride[i]
        data[p]=v
      }else{
        data[u]=v
      }
    })
    return new A(data,om.shape)
  }
})

function indexAtSingleAxis(om,sub,ax){
  assert(om instanceof A&&sub instanceof A&&isInt(ax)&&0<=ax&&ax<om.shape.length)
  var u=sub.toArray(),n=om.shape[ax]
  for(var i=0;i<u.length;i++){isInt(u[i])||domainError();0<=u[i]&&u[i]<n||indexError()}
  var isUniform=0
  if(u.length>=2){var d=u[1]-u[0];isUniform=1;for(var i=2;i<u.length;i++)if(u[i]-u[i-1]!==d){isUniform=0;break}}
  if(isUniform){
    var shape=om.shape.slice(0);shape.splice.apply(shape,[ax,1].concat(sub.shape))
    var stride=om.stride.slice(0)
    var subStride=strideForShape(sub.shape)
    for(var i=0;i<subStride.length;i++)subStride[i]*=d*om.stride[ax]
    stride.splice.apply(stride,[ax,1].concat(subStride))
    var offset=om.offset+u[0]*om.stride[ax]
    return new A(om.data,shape,stride,offset)
  }else{
    var shape1=om.shape.slice(0);shape1.splice(ax,1)
    var stride1=om.stride.slice(0);stride1.splice(ax,1)
    var data=[]
    each(sub,function(x){
      var chunk=new A(om.data,shape1,stride1,om.offset+x*om.stride[ax])
      data.push.apply(data,chunk.toArray())
    })
    var shape = shape1.slice(0)
    var stride = strideForShape(shape)
    shape.splice.apply(shape,[ax, 0].concat(sub.shape))
    var subStride = strideForShape (sub.shape)
    var k=prod(shape1)
    for(var i=0;i<subStride.length;i++)subStride[i]*=k
    stride.splice.apply(stride,[ax,0].concat(subStride))
    return new A(data,shape,stride)
  }
}
addVocabulary({
  '↑':function(om,al){return al?take(om,al):first(om)}
})

// 5↑'ABCDEFGH'     ←→ 'ABCDE'
// ¯3↑'ABCDEFGH'    ←→ 'FGH'
// 3↑22 2 19 12     ←→ 22 2 19
// ¯1↑22 2 19 12    ←→ ,12
// ⍴1↑(2 2⍴⍳4)(⍳10) ←→ ,1
// 2↑1              ←→ 1 0
// 5↑40 92 11       ←→ 40 92 11 0 0
// ¯5↑40 92 11      ←→ 0 0 40 92 11
// 3 3↑1 1⍴0        ←→ 3 3⍴0 0 0 0 0 0 0 0 0
// 5↑"abc"          ←→ 'abc  '
// ¯5↑"abc"         ←→ '  abc'
// 3 3↑1 1⍴"a"      ←→ 3 3⍴'a        '
// 2 3↑1+4 3⍴⍳12    ←→ 2 3⍴1 2 3 4 5 6
// ¯1 3↑1+4 3⍴⍳12   ←→ 1 3⍴10 11 12
// 1 2↑1+4 3⍴⍳12    ←→ 1 2⍴1 2
// 3↑⍬              ←→ 0 0 0
// ¯2↑⍬             ←→ 0 0
// 0↑⍬              ←→ ⍬
// 3 3↑1            ←→ 3 3⍴1 0 0 0 0 0 0 0 0
// 2↑3 3⍴⍳9         ←→ 2 3⍴⍳6
// ¯2↑3 3⍴⍳9        ←→ 2 3⍴3+⍳6
// 4↑3 3⍴⍳9         ←→ 4 3⍴(⍳9),0 0 0
// ⍬↑3 3⍴⍳9         ←→ 3 3⍴⍳9
function take(om,al){
  al.shape.length<=1||rankError()
  if(!om.shape.length)om=new A([om.unwrap()],al.shape.length?repeat([1],al.shape[0]):[1])
  var a=al.toArray()
  a.length<=om.shape.length||rankError()
  for(var i=0;i<a.length;i++)typeof a[i]==='number'&&a[i]===Math.floor(a[i])||domainError()
  var mustCopy=0,shape=om.shape.slice(0)
  for(var i=0;i<a.length;i++){shape[i]=Math.abs(a[i]);if(shape[i]>om.shape[i])mustCopy=1}
  if(mustCopy){
    var stride=Array(shape.length);stride[stride.length-1]=1
    for(var i=stride.length-2;i>=0;i--)stride[i]=stride[i+1]*shape[i+1]
    var data=repeat([om.getPrototype()],prod(shape))
    var copyShape=shape.slice(0),p=om.offset,q=0
    for(var i=0;i<a.length;i++){
      var x=a[i];copyShape[i]=Math.min(om.shape[i],Math.abs(x))
      if(x<0){if(x<-om.shape[i]){q-=(x+om.shape[i])*stride[i]}else{p+=(x+om.shape[i])*om.stride[i]}}
    }
    if(prod(copyShape)){
      var copyIndices=repeat([0],copyShape.length)
      while(1){
        data[q]=om.data[p];axis=copyShape.length-1
        while(axis>=0&&copyIndices[axis]+1===copyShape[axis]){
          p-=copyIndices[axis]*om.stride[axis];q-=copyIndices[axis]*stride[axis];copyIndices[axis--]=0
        }
        if(axis<0)break
        p+=om.stride[axis];q+=stride[axis];copyIndices[axis]++
      }
    }
    return new A(data,shape,stride)
  }else{
    var offset=om.offset;for(var i=0;i<a.length;i++)if(a[i]<0)offset+=(om.shape[i]+a[i])*om.stride[i]
    return new A(om.data,shape,om.stride,offset)
  }
}

// ↑(1 2 3)(4 5 6) ←→ 1 2 3
// ↑(1 2)(3 4 5)   ←→ 1 2
// ↑'AB'           ←→ 'A'
// ↑123            ←→ 123
// ↑⍬              ←→ 0
//! ↑''             ←→ ' '
function first(om){var x=om.empty()?om.getPrototype():om.data[om.offset];return x instanceof A?x:new A([x],[])}
addVocabulary({
  '⍉':function(om,al){
    if(al){
      // (2 2⍴⍳4)⍉2 2 2 2⍴⍳16 !!! RANK ERROR
      // 0⍉3 5 8 ←→ 3 5 8
      // 1 0⍉2 2 2⍴⍳8 !!! LENGTH ERROR
      // ¯1⍉1 2 !!! DOMAIN ERROR
      // 'a'⍉1 2 !!! DOMAIN ERROR
      // 2⍉1 2 !!! RANK ERROR
      // 2 0 1⍉2 3 4⍴⍳24 ←→ 3 4 2⍴0 12 1 13 2 14 3 15 4 16 5 17 6 18 7 19 8 20 9 21 10 22 11 23
      // 2 0 0⍉2 3 4⍴⍳24 !!! RANK ERROR
      // 0 0⍉3 3⍴⍳9 ←→ 0 4 8
      // 0 0⍉2 3⍴⍳9 ←→ 0 4
      // 0 0 0⍉3 3 3⍴⍳27 ←→ 0 13 26
      // 0 1 0⍉3 3 3⍴⍳27 ←→ 3 3⍴0 3 6 10 13 16 20 23 26
      al.shape.length<=1||rankError()
      al.shape.length||(al=new A([al.unwrap()]))
      var n=om.shape.length
      al.shape[0]===n||lengthError()
      var shape=[],stride=[],a=al.toArray()
      for(var i=0;i<a.length;i++){
        var x=a[i]
        isInt(x,0)||domainError()
        x<n||rankError()
        if(shape[x]==null){
          shape[x]=om.shape[i]
          stride[x]=om.stride[i]
        }else{
          shape[x]=Math.min(shape[x],om.shape[i])
          stride[x]+=om.stride[i]
        }
      }
      for(var i=0;i<shape.length;i++)shape[i]!=null||rankError()
      return new A(om.data,shape,stride,om.offset)
    }else{
      // ⍉2 3⍴1 2 3 6 7 8  ←→ 3 2⍴1 6 2 7 3 8
      // ⍴⍉2 3⍴1 2 3 6 7 8 ←→ 3 2
      // ⍉1 2 3            ←→ 1 2 3
      // ⍉2 3 4⍴⍳24        ←→ (4 3 2⍴0 12  4 16   8 20
      // ...                         1 13  5 17   9 21
      // ...                         2 14  6 18  10 22
      // ...                         3 15  7 19  11 23)
      // ⍉⍬                ←→ ⍬
      // ⍉''               ←→ ''
      return new A(om.data,reversed(om.shape),reversed(om.stride),om.offset)
    }
  }
})
addVocabulary({
  //  ({'monadic'}⍠{'dyadic'})0 ←→ 'monadic'
  // 0({'monadic'}⍠{'dyadic'})0 ←→ 'dyadic'
  '⍠':conjunction(function(f,g){
    assert(typeof f==='function')
    assert(typeof g==='function')
    return function(om,al,axis){return(al?f:g)(om,al,axis)}
  })
})
var NOUN=1,VERB=2,ADV=3,CONJ=4
function exec(s,o){ // s:APL code, o:options
  o=o||{}
  var ast=parse(s,o),code=compileAST(ast,o),env=[prelude.env[0].slice(0)]
  for(var k in ast.vars)env[0][ast.vars[k].slot]=o.ctx[k]
  var r=vm({code:code,env:env})
  for(var k in ast.vars){
    var v=ast.vars[k],x=o.ctx[k]=env[0][v.slot]
    if(v.category===ADV)x.adv=1
    if(v.category===CONJ)x.conj=1
  }
  return r
}
function repr(x){
  return x===null||['string','number','boolean'].indexOf(typeof x)>=0?JSON.stringify(x):
         x instanceof Array?'['+x.map(repr).join(',')+']':
         x.repr?x.repr():
         '{'+Object.keys(x).map(function(k){return repr(k)+':'+repr(x[k])}).join(',')+'}'
}
function compileAST(ast,o){
  o=o||{}
  ast.scopeDepth=0
  ast.nSlots=prelude.nSlots
  ast.vars=Object.create(prelude.vars)
  o.ctx=o.ctx||Object.create(vocabulary)
  for(var key in o.ctx)if(!ast.vars[key]){
    var value=o.ctx[key]
    var varInfo=ast.vars[key]={category:NOUN,slot:ast.nSlots++,scopeDepth:ast.scopeDepth}
    if(typeof value==='function'||value instanceof Proc){
      varInfo.category=value.adv?ADV:value.conj?CONJ:VERB
      if(/^[gs]et_.*/.test(key))ast.vars[key.slice(4)]={category:NOUN}
    }
  }
  function err(node,message){syntaxError({message:message,file:o.file,offset:node.offset,aplCode:o.aplCode})}
  assert(VERB<ADV&&ADV<CONJ)//we are relying on this ordering below
  function categorizeLambdas(node){
    switch(node[0]){
      case'B':case':':case'←':case'[':case'{':case'.':case'⍬':
        var r=VERB;for(var i=1;i<node.length;i++)if(node[i])r=Math.max(r,categorizeLambdas(node[i]))
        if(node[0]==='{'){node.category=r;return VERB}else{return r}
      case'S':case'N':case'J':return 0
      case'X':var s=node[1];return s==='⍺⍺'||s==='⍶'||s==='∇∇'?ADV:s==='⍵⍵'||s==='⍹'?CONJ:VERB
      default:assert(0)
    }
  }
  categorizeLambdas(ast)
  var queue=[ast] // accumulates"body"nodes we encounter on the way
  while(queue.length){
    var scopeNode=queue.shift(),vars=scopeNode.vars
    function visit(node){
      node.scopeNode=scopeNode
      switch(node[0]){
        case':':var r=visit(node[1]);visit(node[2]);return r
        case'←':return visitLHS(node[1],visit(node[2]))
        case'X':
          var name=node[1],v=vars['get_'+name],r
          if(v&&v.category===VERB){
            return NOUN
          }else{
            // x ⋄ x←0 !!! VALUE ERROR
            return vars[name]&&vars[name].category||
              valueError('Symbol '+name+' is referenced before assignment.',
                {file:o.file,offset:node.offset,aplCode:o.aplCode})
          }
        case'{':
          for(var i=1;i<node.length;i++){
            var d,v
            queue.push(extend(node[i],{
              scopeNode:scopeNode,
              scopeDepth:d=scopeNode.scopeDepth+1+(node.category!==VERB),
              nSlots:4,
              vars:v=extend(Object.create(vars),{
                '⍵':{slot:0,scopeDepth:d,category:NOUN},
                '∇':{slot:1,scopeDepth:d,category:VERB},
                '⍺':{slot:2,scopeDepth:d,category:NOUN},
                // slot 3 is reserved for a "base pointer"
                '⍫':{       scopeDepth:d,category:VERB}
              })
            }))
            if(node.category===CONJ){
              v['⍵⍵']=v['⍹']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:CONJ}
              v['⍺⍺']=v['⍶']={slot:2,scopeDepth:d-1,category:VERB}
            }else if(node.category===ADV){
              v['⍺⍺']=v['⍶']={slot:0,scopeDepth:d-1,category:VERB}
              v['∇∇']=       {slot:1,scopeDepth:d-1,category:ADV}
            }
          }
          return node.category||VERB
        case'S':case'N':case'J':case'⍬':return NOUN
        case'[':
          for(var i=2;i<node.length;i++)if(node[i]&&visit(node[i])!==NOUN)err(node,'Indices must be nouns.')
          return visit(node[1])
        case'.':
          var a=node.slice(1),h=Array(a.length)
          for(var i=a.length-1;i>=0;i--)h[i]=visit(a[i])
          // Form vectors from sequences of data
          var i=0
          while(i<a.length-1){
            if(h[i]===NOUN&&h[i+1]===NOUN){
              var j=i+2;while(j<a.length&&h[j]===NOUN)j++
              a.splice(i,j-i,['V'].concat(a.slice(i,j)))
              h.splice(i,j-i,NOUN)
            }else{
              i++
            }
          }
          // Apply adverbs and conjunctions
          // ⌽¨⍣3⊢(1 2)3(4 5 6) ←→ (2 1)3(6 5 4)
          var i=0
          while(i < a.length){
            if(h[i]===VERB&&i+1<a.length&&h[i+1]===ADV){
              a.splice(i,2,['A'].concat(a.slice(i,i+2)))
              h.splice(i,2,VERB)
            }else if((h[i]===NOUN||h[i]===VERB||h[i]===CONJ)&&i+2<a.length&&h[i+1]===CONJ&&(h[i+2]===NOUN||h[i+2]===VERB)){
              // allow conjunction-conjunction-something to accommodate ∘.f syntax
              a.splice(i,3,['C'].concat(a.slice(i,i+3)))
              h.splice(i,3,VERB)
            }else{
              i++
            }
          }
          // Atops
          if(h.length===2&&h[0]!==NOUN&&h[1]!==NOUN){a=[['T'].concat(a)];h=[VERB]}
          // Forks
          if(h.length>=3&&h.length%2&&h.indexOf(NOUN)<0){a=[['F'].concat(a)];h=[VERB]}
          if(h[h.length-1]!==NOUN){
            if(h.length>1)err(a[h.length-1],'Trailing function in expression')
          }else{
            // Apply monadic and dyadic functions
            while(h.length>1){
              if(h.length===2||h[h.length-3]!==NOUN){
                a.splice(-2,9e9,['M'].concat(a.slice(-2)))
                h.splice(-2,9e9,NOUN)
              }else{
                a.splice(-3,9e9,['D'].concat(a.slice(-3)))
                h.splice(-3,9e9,NOUN)
              }
            }
          }
          node.splice(0,9e9,a[0])
          extend(node,a[0])
          return h[0]
      }
      assert(0)
    }
    function visitLHS(node,rhsCategory){
      node.scopeNode=scopeNode
      switch(node[0]){
        case'X':
          var name=node[1];if(name==='∇'||name==='⍫')err(node,'Assignment to '+name+' is not allowed.')
          if(vars[name]){
            if(vars[name].category!==rhsCategory){
              err(node,'Inconsistent usage of symbol '+name+', it is assigned both nouns and verbs.')
            }
          }else{
            vars[name]={scopeDepth:scopeNode.scopeDepth,slot:scopeNode.nSlots++,category:rhsCategory}
          }
          break
        case'.':
          rhsCategory===NOUN||err(node,'Strand assignment can be used only for nouns.')
          for(var i=1;i<node.length;i++)visitLHS(node[i],rhsCategory)
          break
        case'[':
          rhsCategory===NOUN||err(node,'Indexed assignment can be used only for nouns.')
          visitLHS(node[1],rhsCategory);for(var i=2;i<node.length;i++)node[i]&&visit(node[i])
          break
        default:
          err(node,'Invalid LHS node type: '+JSON.stringify(node[0]))
      }
      return rhsCategory
    }
    for(var i=1;i<scopeNode.length;i++)visit(scopeNode[i])
  }
  function render(node){
    switch(node[0]){
      case'B':
        if(node.length===1){
          // {}0 ←→ ⍬
          return[LDC,A.zilde,RET]
        }else{
          var a=[];for(var i=1;i<node.length;i++){a.push.apply(a,render(node[i]));a.push(POP)}
          a[a.length-1]=RET
          return a
        }
      case':':var x=render(node[1]),y=render(node[2]);return x.concat(JEQ,y.length+2,POP,y,RET)
      case'←':
        // A←5     ←→ 5
        // A×A←2 5 ←→ 4 25
        return render(node[2]).concat(renderLHS(node[1]))
      case'X':
        // r←3 ⋄ get_c←{2×○r} ⋄ get_S←{○r*2}
        // ... before←.01×⌊100×r c S
        // ... r←r+1
        // ... after←.01×⌊100×r c S
        // ... before after ←→ (3 18.84 28.27)(4 25.13 50.26)
        // {⍺}0 !!! VALUE ERROR
        // {x}0 ⋄ x←0 !!! VALUE ERROR
        // {⍫1⋄2}⍬ ←→ 1
        // c←{} ⋄ x←{c←⍫⋄1}⍬ ⋄ {x=1:c 2⋄x}⍬ ←→ 2
        var s=node[1],vars=node.scopeNode.vars,v
        return s==='⍫'?[CON]:
               (v=vars['get_'+s])&&v.category===VERB?[LDC,A.zero,GET,v.scopeDepth,v.slot,MON]:
                 [GET, vars[s].scopeDepth, vars[s].slot]
      case'{':
        // {1 + 1} 1                    ←→ 2
        // {⍵=0:1 ⋄ 2×∇⍵-1} 5           ←→ 32 # two to the power of
        // {⍵<2 : 1 ⋄ (∇⍵-1)+(∇⍵-2) } 8 ←→ 34 # Fibonacci sequence
        // ⊂{⍺⍺ ⍺⍺ ⍵}'hello'            ←→ ⊂⊂'hello'
        // ⊂{⍺⍺ ⍵⍵ ⍵}⌽'hello'           ←→ ⊂'olleh'
        // ⊂{⍶⍶⍵}'hello'                ←→ ⊂⊂'hello'
        // ⊂{⍶⍹⍵}⌽'hello'               ←→ ⊂'olleh'
        // +{⍵⍶⍵}10 20 30               ←→ 20 40 60
        // f←{⍵⍶⍵} ⋄ +f 10 20 30        ←→ 20 40 60
        // twice←{⍶⍶⍵} ⋄ *twice 2       ←→ 1618.1779919126539
        // f←{-⍵;⍺×⍵} ⋄ (f 5)(3 f 5)    ←→ ¯5 15
        // f←{;} ⋄ (f 5)(3 f 5)         ←→ ⍬⍬
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ *²2          ←→ 1618.1779919126539
        // ²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ 3*²2         ←→ 19683
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ +H÷ 2        ←→ 2.5
        // H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ 7 +H÷ 2      ←→ 7.5
        // {;;}                         !!!
        var x=render(node[1])
        var lx=[LAM,x.length].concat(x)
        if(node.length===2){
          f=lx
        }else if(node.length===3){
          var y=render(node[2]),ly=[LAM,y.length].concat(y),v=node.scopeNode.vars['⍠']
          f=ly.concat(GET,v.scopeDepth,v.slot,lx,DYA)
        }else{
          err(node)
        }
        return node.category===VERB?f:[LAM,f.length+1].concat(f,RET)
      case'S':
        // ⍴''     ←→ ,0
        // ⍴'x'    ←→ ⍬
        // ⍴'xx'   ←→ ,2
        // ⍴'a''b' ←→ ,3
        // ⍴"a""b" ←→ ,3
        // ⍴'a""b' ←→ ,4
        // ⍴'''a'  ←→ ,2
        // ⍴'a'''  ←→ ,2
        // ''''    ←→ "'"
        // ⍴"\f\t\n\r\u1234\xff" ←→ ,18
        // "a      !!!
        var d=node[1][0] // the delimiter: " or '
        var s=node[1].slice(1,-1).replace(RegExp(d+d,'g'),d)
        return[LDC,new A(s,s.length===1?[]:[s.length])]
      case'N':
        // ∞ ←→ ¯
        // ¯∞ ←→ ¯¯
        // ¯∞j¯∞ ←→ ¯¯j¯¯
        // ∞∞ ←→ ¯ ¯
        // ∞¯ ←→ ¯ ¯
        var a=node[1].replace(/[¯∞]/g,'-').split(/j/i).map(function(x){
          return x==='-'?Infinity:x==='--'?-Infinity:x.match(/^-?0x/i)?parseInt(x,16):parseFloat(x)
        })
        var v=a[1]?new Z(a[0],a[1]):a[0]
        return[LDC,new A([v],[])]
      case'J':
        // 123 + «456 + 789» ←→ 1368
        var f=Function('return function(_w,_a){return('+node[1].replace(/^«|»$/g,'')+')}')()
        return[EMB,function(_w,_a){return aplify(f(_w,_a))}]
      case'[':
        // ⍴ x[⍋x←6?40] ←→ ,6
        var v=node.scopeNode.vars._index,axes=[],a=[],c
        for(var i=2;i<node.length;i++)if(c=node[i]){axes.push(i-2);a.push.apply(a,render(c))}
        a.push(VEC,axes.length,LDC,new A(axes),VEC,2,GET,v.scopeDepth,v.slot)
        a.push.apply(a,render(node[1]))
        a.push(DYA)
        return a
      case'V':
        var fragments=[],areAllConst=1
        for(var i=1;i<node.length;i++){
          var f=render(node[i]);fragments.push(f);if(f.length!==2||f[0]!==LDC)areAllConst=0
        }
        return areAllConst?[LDC,new A(fragments.map(function(f){return f[1].isSimple()?f[1].unwrap():f[1]}))]
                         :[].concat.apply([],fragments).concat([VEC,node.length-1])
      case'⍬':return[LDC,A.zilde]
      case'M':return render(node[2]).concat(render(node[1]),MON)
      case'A':return render(node[1]).concat(render(node[2]),MON)
      case'D':case'C':return render(node[3]).concat(render(node[2]),render(node[1]),DYA)
      case'T':
        var v=node.scopeNode.vars._atop
        return render(node[2]).concat(GET,v.scopeDepth,v.slot,render(node[1]),DYA)
      case'F':
        var u=node.scopeNode.vars._atop
        var v=node.scopeNode.vars._fork1
        var w=node.scopeNode.vars._fork2
        var i=node.length-1
        var r=render(node[i--])
        while(i>=2)r=r.concat(GET,v.scopeDepth,v.slot,render(node[i--]),DYA,
                              GET,w.scopeDepth,w.slot,render(node[i--]),DYA)
        return i?r.concat(render(node[1]),GET,u.scopeDepth,u.slot,DYA):r
      default:assert(0)
    }
  }
  function renderLHS(node){
    switch(node[0]){
      case'X':
        var name=node[1],vars=node.scopeNode.vars,v=vars['set_'+name]
        return v&&v.category===VERB?[GET,v.scopeDepth,v.slot,MON]:[SET,vars[name].scopeDepth,vars[name].slot]
      case'.': // strand assignment
        // (a b) ← 1 2 ⋄ a           ←→ 1
        // (a b) ← 1 2 ⋄ b           ←→ 2
        // (a b) ← +                 !!!
        // (a b c) ← 3 4 5 ⋄ a b c   ←→ 3 4 5
        // (a b c) ← 6     ⋄ a b c   ←→ 6 6 6
        // (a b c) ← 7 8   ⋄ a b c   !!!
        // ((a b)c)←3(4 5) ⋄ a b c   ←→ 3 3 (4 5)
        var n=node.length-1,a=[SPL,n]
        for(var i=1;i<node.length;i++){a.push.apply(a,renderLHS(node[i]));a.push(POP)}
        return a
      case'[': // indexed assignment
        var axes=[],a=[],v=node.scopeNode.vars._substitute
        for(var i=2;i<node.length;i++)if(node[i]){axes.push(i-2);a.push.apply(a,render(node[i]))}
        a.push(VEC,axes.length)
        a.push.apply(a,render(node[1]))
        a.push(LDC,new A(axes),VEC,4,GET,v.scopeDepth,v.slot,MON)
        a.push.apply(a,renderLHS(node[1]))
        return a
    }
    assert(0)
  }
  return render(ast)
}
;(function(){
  var env=prelude.env=[[]]
  for(var k in prelude.vars)env[0][prelude.vars[k].slot]=vocabulary[k]
  vm({code:prelude.code,env:env})
  for(var k in prelude.vars)vocabulary[k]=env[0][prelude.vars[k].slot]
}())
function aplify(x){
  if(typeof x==='string')return x.length===1?A.scalar(x):new A(x)
  if(typeof x==='number')return A.scalar(x)
  if(x instanceof Array)return new A(x.map(function(y){y=aplify(y);return y.shape.length?y:y.unwrap()}))
  if(x instanceof A)return x
  aplError('Cannot aplify object:'+x)
}
var apl=this.apl=function(aplCode,opts){return(apl.ws(opts))(aplCode)}
extend(apl,{format:format,approx:approx,parse:parse,compileAST:compileAST,repr:repr})
apl.ws=function(opts){
  opts=opts||{}
  ctx=Object.create(vocabulary)
  if(opts.in )ctx['get_⎕']=ctx['get_⍞']=function(){var s=opts.in();assert(typeof s==='string');return new A(s)}
  if(opts.out)ctx['set_⎕']=ctx['set_⍞']=function(x){opts.out(format(x).join('\n')+'\n')}
  return function(aplCode){return exec(aplCode,{ctx:ctx})}
}
function readline(prompt,f){
  ;(readline.requesters=readline.requesters||[]).push(f)
  var rl=readline.rl
  if(!rl){
    rl=readline.rl=require('readline').createInterface(process.stdin,process.stdout)
    rl.on('line',function(x){var h=readline.requesters.pop();h&&h(x)})
    rl.on('close',function(){process.stdout.write('\n');process.exit(0)})
  }
  rl.setPrompt(prompt);rl.prompt()
}
if(typeof module!=='undefined'){
  module.exports=apl
  if(module===require.main)(function(){
    var usage='Usage: apl.js [options] [filename.apl]\n'+
              'Options:\n'+
              '  -l --linewise   Process stdin line by line and disable prompt\n'
    var file,linewise
    process.argv.slice(2).forEach(function(arg){
      if(arg==='-h'||arg==='--help'){process.stderr.write(usage);process.exit(0)}
      else if(arg==='-l'||arg=='--linewise')linewise=1
      else if(arg[0]==='-'){process.stderr.write('unrecognized option:'+arg+'\n'+usage);process.exit(1)}
      else if(file){process.stderr.write(usage);process.exit(1)}
      else file=arg
    })
    if(file){
      exec(require('fs').readFileSync(file,'utf8'))
    }else if(linewise){
      var fs=require('fs'),ws=apl.ws(),a=Buffer(256),i=0,n=0,b=Buffer(a.length),k
      while(k=fs.readSync(0,b,0,b.length)){
        if(n+k>a.length)a=Buffer.concat([a,a])
        b.copy(a,n,0,k);n+=k
        while(i<n){
          if(a[i]===10){ // '\n'
            var r;try{r=format(ws(''+a.slice(0,i))).join('\n')+'\n'}catch(e){r=e+'\n'}
            process.stdout.write(r);a.copy(a,0,i+1);n-=i+1;i=0
          }else{
            i++
          }
        }
      }
    }else if(!require('tty').isatty()){
      var fs=require('fs'),b=Buffer(1024),n=0,k
      while(k=fs.readSync(0,b,n,b.length-n)){n+=k;n===b.length&&b.copy(b=Buffer(2*n))} // read all of stdin
      exec(b.toString('utf8',0,n))
    }else{
      var ws=apl.ws(),out=process.stdout
      function f(s){
        try{s.match(/^[\ \t\f\r\n]*$/)||out.write(format(ws(s)).join('\n')+'\n')}catch(e){out.write(e+'\n')}
        readline('      ',f)
      }
      f('')
    }
  }())
}
/*! jQuery v1.10.1 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/
(function(e,t){var n,r,i=typeof t,o=e.location,a=e.document,s=a.documentElement,l=e.jQuery,u=e.$,c={},p=[],f="1.10.1",d=p.concat,h=p.push,g=p.slice,m=p.indexOf,y=c.toString,v=c.hasOwnProperty,b=f.trim,x=function(e,t){return new x.fn.init(e,t,r)},w=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=/\S+/g,C=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,k=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,E=/^[\],:{}\s]*$/,S=/(?:^|:|,)(?:\s*\[)+/g,A=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,j=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,D=/^-ms-/,L=/-([\da-z])/gi,H=function(e,t){return t.toUpperCase()},q=function(e){(a.addEventListener||"load"===e.type||"complete"===a.readyState)&&(_(),x.ready())},_=function(){a.addEventListener?(a.removeEventListener("DOMContentLoaded",q,!1),e.removeEventListener("load",q,!1)):(a.detachEvent("onreadystatechange",q),e.detachEvent("onload",q))};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,n,r){var i,o;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof x?n[0]:n,x.merge(this,x.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:a,!0)),k.test(i[1])&&x.isPlainObject(n))for(i in n)x.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(o=a.getElementById(i[2]),o&&o.parentNode){if(o.id!==i[2])return r.find(e);this.length=1,this[0]=o}return this.context=a,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return g.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(g.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},l=1,u=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},l=2),"object"==typeof s||x.isFunction(s)||(s={}),u===l&&(s=this,--l);u>l;l++)if(null!=(o=arguments[l]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(x.isPlainObject(r)||(n=x.isArray(r)))?(n?(n=!1,a=e&&x.isArray(e)?e:[]):a=e&&x.isPlainObject(e)?e:{},s[i]=x.extend(c,a,r)):r!==t&&(s[i]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=l),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){if(e===!0?!--x.readyWait:!x.isReady){if(!a.body)return setTimeout(x.ready);x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(a,[x]),x.fn.trigger&&x(a).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray||function(e){return"array"===x.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?c[y.call(e)]||"object":typeof e},isPlainObject:function(e){var n;if(!e||"object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!v.call(e,"constructor")&&!v.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(r){return!1}if(x.support.ownLast)for(n in e)return v.call(e,n);for(n in e);return n===t||v.call(e,n)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||a;var r=k.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=x.trim(n),n&&E.test(n.replace(A,"@").replace(j,"]").replace(S,"")))?Function("return "+n)():(x.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||x.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&x.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(D,"ms-").replace(L,H)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:b&&!b.call("\ufeff\u00a0")?function(e){return null==e?"":b.call(e)}:function(e){return null==e?"":(e+"").replace(C,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(m)return m.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return d.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),x.isFunction(e)?(r=g.call(arguments,2),i=function(){return e.apply(n||this,r.concat(g.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):t},access:function(e,n,r,i,o,a,s){var l=0,u=e.length,c=null==r;if("object"===x.type(r)){o=!0;for(l in r)x.access(e,n,l,r[l],!0,a,s)}else if(i!==t&&(o=!0,x.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(x(e),n)})),n))for(;u>l;l++)n(e[l],r,s?i:i.call(e[l],l,n(e[l],r)));return o?e:c?n.call(e):u?n(e[0],r):a},now:function(){return(new Date).getTime()},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),x.ready.promise=function(t){if(!n)if(n=x.Deferred(),"complete"===a.readyState)setTimeout(x.ready);else if(a.addEventListener)a.addEventListener("DOMContentLoaded",q,!1),e.addEventListener("load",q,!1);else{a.attachEvent("onreadystatechange",q),e.attachEvent("onload",q);var r=!1;try{r=null==e.frameElement&&a.documentElement}catch(i){}r&&r.doScroll&&function o(){if(!x.isReady){try{r.doScroll("left")}catch(e){return setTimeout(o,50)}_(),x.ready()}}()}return n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){c["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=x(a),function(e,t){var n,r,i,o,a,s,l,u,c,p,f,d,h,g,m,y,v,b="sizzle"+-new Date,w=e.document,T=0,C=0,N=lt(),k=lt(),E=lt(),S=!1,A=function(){return 0},j=typeof t,D=1<<31,L={}.hasOwnProperty,H=[],q=H.pop,_=H.push,M=H.push,O=H.slice,F=H.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},B="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",P="[\\x20\\t\\r\\n\\f]",R="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=R.replace("w","w#"),$="\\["+P+"*("+R+")"+P+"*(?:([*^$|!~]?=)"+P+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+P+"*\\]",I=":("+R+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",z=RegExp("^"+P+"+|((?:^|[^\\\\])(?:\\\\.)*)"+P+"+$","g"),X=RegExp("^"+P+"*,"+P+"*"),U=RegExp("^"+P+"*([>+~]|"+P+")"+P+"*"),V=RegExp(P+"*[+~]"),Y=RegExp("="+P+"*([^\\]'\"]*)"+P+"*\\]","g"),J=RegExp(I),G=RegExp("^"+W+"$"),Q={ID:RegExp("^#("+R+")"),CLASS:RegExp("^\\.("+R+")"),TAG:RegExp("^("+R.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+I),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+P+"*(even|odd|(([+-]|)(\\d*)n|)"+P+"*(?:([+-]|)"+P+"*(\\d+)|))"+P+"*\\)|)","i"),bool:RegExp("^(?:"+B+")$","i"),needsContext:RegExp("^"+P+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+P+"*((?:-\\d)?\\d*)"+P+"*\\)|)(?=[^-]|$)","i")},K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,et=/^(?:input|select|textarea|button)$/i,tt=/^h\d$/i,nt=/'|\\/g,rt=RegExp("\\\\([\\da-f]{1,6}"+P+"?|("+P+")|.)","ig"),it=function(e,t,n){var r="0x"+t-65536;return r!==r||n?t:0>r?String.fromCharCode(r+65536):String.fromCharCode(55296|r>>10,56320|1023&r)};try{M.apply(H=O.call(w.childNodes),w.childNodes),H[w.childNodes.length].nodeType}catch(ot){M={apply:H.length?function(e,t){_.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function at(e,t,n,i){var o,a,s,l,u,c,d,m,y,x;if((t?t.ownerDocument||t:w)!==f&&p(t),t=t||f,n=n||[],!e||"string"!=typeof e)return n;if(1!==(l=t.nodeType)&&9!==l)return[];if(h&&!i){if(o=Z.exec(e))if(s=o[1]){if(9===l){if(a=t.getElementById(s),!a||!a.parentNode)return n;if(a.id===s)return n.push(a),n}else if(t.ownerDocument&&(a=t.ownerDocument.getElementById(s))&&v(t,a)&&a.id===s)return n.push(a),n}else{if(o[2])return M.apply(n,t.getElementsByTagName(e)),n;if((s=o[3])&&r.getElementsByClassName&&t.getElementsByClassName)return M.apply(n,t.getElementsByClassName(s)),n}if(r.qsa&&(!g||!g.test(e))){if(m=d=b,y=t,x=9===l&&e,1===l&&"object"!==t.nodeName.toLowerCase()){c=bt(e),(d=t.getAttribute("id"))?m=d.replace(nt,"\\$&"):t.setAttribute("id",m),m="[id='"+m+"'] ",u=c.length;while(u--)c[u]=m+xt(c[u]);y=V.test(e)&&t.parentNode||t,x=c.join(",")}if(x)try{return M.apply(n,y.querySelectorAll(x)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return At(e.replace(z,"$1"),t,n,i)}function st(e){return K.test(e+"")}function lt(){var e=[];function t(n,r){return e.push(n+=" ")>o.cacheLength&&delete t[e.shift()],t[n]=r}return t}function ut(e){return e[b]=!0,e}function ct(e){var t=f.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function pt(e,t,n){e=e.split("|");var r,i=e.length,a=n?null:t;while(i--)(r=o.attrHandle[e[i]])&&r!==t||(o.attrHandle[e[i]]=a)}function ft(e,t){var n=e.getAttributeNode(t);return n&&n.specified?n.value:e[t]===!0?t.toLowerCase():null}function dt(e,t){return e.getAttribute(t,"type"===t.toLowerCase()?1:2)}function ht(e){return"input"===e.nodeName.toLowerCase()?e.defaultValue:t}function gt(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function mt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function yt(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function vt(e){return ut(function(t){return t=+t,ut(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}s=at.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},r=at.support={},p=at.setDocument=function(e){var n=e?e.ownerDocument||e:w,i=n.parentWindow;return n!==f&&9===n.nodeType&&n.documentElement?(f=n,d=n.documentElement,h=!s(n),i&&i.frameElement&&i.attachEvent("onbeforeunload",function(){p()}),r.attributes=ct(function(e){return e.innerHTML="<a href='#'></a>",pt("type|href|height|width",dt,"#"===e.firstChild.getAttribute("href")),pt(B,ft,null==e.getAttribute("disabled")),e.className="i",!e.getAttribute("className")}),r.input=ct(function(e){return e.innerHTML="<input>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")}),pt("value",ht,r.attributes&&r.input),r.getElementsByTagName=ct(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),r.getElementsByClassName=ct(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),r.getById=ct(function(e){return d.appendChild(e).id=b,!n.getElementsByName||!n.getElementsByName(b).length}),r.getById?(o.find.ID=function(e,t){if(typeof t.getElementById!==j&&h){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){return e.getAttribute("id")===t}}):(delete o.find.ID,o.filter.ID=function(e){var t=e.replace(rt,it);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),o.find.TAG=r.getElementsByTagName?function(e,n){return typeof n.getElementsByTagName!==j?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},o.find.CLASS=r.getElementsByClassName&&function(e,n){return typeof n.getElementsByClassName!==j&&h?n.getElementsByClassName(e):t},m=[],g=[],(r.qsa=st(n.querySelectorAll))&&(ct(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||g.push("\\["+P+"*(?:value|"+B+")"),e.querySelectorAll(":checked").length||g.push(":checked")}),ct(function(e){var t=n.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&g.push("[*^$]="+P+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||g.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),g.push(",.*:")})),(r.matchesSelector=st(y=d.webkitMatchesSelector||d.mozMatchesSelector||d.oMatchesSelector||d.msMatchesSelector))&&ct(function(e){r.disconnectedMatch=y.call(e,"div"),y.call(e,"[s!='']:x"),m.push("!=",I)}),g=g.length&&RegExp(g.join("|")),m=m.length&&RegExp(m.join("|")),v=st(d.contains)||d.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},r.sortDetached=ct(function(e){return 1&e.compareDocumentPosition(n.createElement("div"))}),A=d.compareDocumentPosition?function(e,t){if(e===t)return S=!0,0;var i=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t);return i?1&i||!r.sortDetached&&t.compareDocumentPosition(e)===i?e===n||v(w,e)?-1:t===n||v(w,t)?1:c?F.call(c,e)-F.call(c,t):0:4&i?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return S=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:c?F.call(c,e)-F.call(c,t):0;if(o===a)return gt(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?gt(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},n):f},at.matches=function(e,t){return at(e,null,null,t)},at.matchesSelector=function(e,t){if((e.ownerDocument||e)!==f&&p(e),t=t.replace(Y,"='$1']"),!(!r.matchesSelector||!h||m&&m.test(t)||g&&g.test(t)))try{var n=y.call(e,t);if(n||r.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(i){}return at(t,f,null,[e]).length>0},at.contains=function(e,t){return(e.ownerDocument||e)!==f&&p(e),v(e,t)},at.attr=function(e,n){(e.ownerDocument||e)!==f&&p(e);var i=o.attrHandle[n.toLowerCase()],a=i&&L.call(o.attrHandle,n.toLowerCase())?i(e,n,!h):t;return a===t?r.attributes||!h?e.getAttribute(n):(a=e.getAttributeNode(n))&&a.specified?a.value:null:a},at.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},at.uniqueSort=function(e){var t,n=[],i=0,o=0;if(S=!r.detectDuplicates,c=!r.sortStable&&e.slice(0),e.sort(A),S){while(t=e[o++])t===e[o]&&(i=n.push(o));while(i--)e.splice(n[i],1)}return e},a=at.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=a(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=a(t);return n},o=at.selectors={cacheLength:50,createPseudo:ut,match:Q,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(rt,it),e[3]=(e[4]||e[5]||"").replace(rt,it),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||at.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&at.error(e[0]),e},PSEUDO:function(e){var n,r=!e[5]&&e[2];return Q.CHILD.test(e[0])?null:(e[3]&&e[4]!==t?e[2]=e[4]:r&&J.test(r)&&(n=bt(r,!0))&&(n=r.indexOf(")",r.length-n)-r.length)&&(e[0]=e[0].slice(0,n),e[2]=r.slice(0,n)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(rt,it).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=N[e+" "];return t||(t=RegExp("(^|"+P+")"+e+"("+P+"|$)"))&&N(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=at.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,l){var u,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!l&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[b]||(m[b]={}),u=c[e]||[],d=u[0]===T&&u[1],f=u[0]===T&&u[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[T,d,f];break}}else if(v&&(u=(t[b]||(t[b]={}))[e])&&u[0]===T)f=u[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[b]||(p[b]={}))[e]=[T,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=o.pseudos[e]||o.setFilters[e.toLowerCase()]||at.error("unsupported pseudo: "+e);return r[b]?r(t):r.length>1?(n=[e,e,"",t],o.setFilters.hasOwnProperty(e.toLowerCase())?ut(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=F.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:ut(function(e){var t=[],n=[],r=l(e.replace(z,"$1"));return r[b]?ut(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:ut(function(e){return function(t){return at(e,t).length>0}}),contains:ut(function(e){return function(t){return(t.textContent||t.innerText||a(t)).indexOf(e)>-1}}),lang:ut(function(e){return G.test(e||"")||at.error("unsupported lang: "+e),e=e.replace(rt,it).toLowerCase(),function(t){var n;do if(n=h?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===d},focus:function(e){return e===f.activeElement&&(!f.hasFocus||f.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!o.pseudos.empty(e)},header:function(e){return tt.test(e.nodeName)},input:function(e){return et.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:vt(function(){return[0]}),last:vt(function(e,t){return[t-1]}),eq:vt(function(e,t,n){return[0>n?n+t:n]}),even:vt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:vt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:vt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:vt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})o.pseudos[n]=mt(n);for(n in{submit:!0,reset:!0})o.pseudos[n]=yt(n);function bt(e,t){var n,r,i,a,s,l,u,c=k[e+" "];if(c)return t?0:c.slice(0);s=e,l=[],u=o.preFilter;while(s){(!n||(r=X.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),l.push(i=[])),n=!1,(r=U.exec(s))&&(n=r.shift(),i.push({value:n,type:r[0].replace(z," ")}),s=s.slice(n.length));for(a in o.filter)!(r=Q[a].exec(s))||u[a]&&!(r=u[a](r))||(n=r.shift(),i.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?at.error(e):k(e,l).slice(0)}function xt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function wt(e,t,n){var r=t.dir,o=n&&"parentNode"===r,a=C++;return t.first?function(t,n,i){while(t=t[r])if(1===t.nodeType||o)return e(t,n,i)}:function(t,n,s){var l,u,c,p=T+" "+a;if(s){while(t=t[r])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[r])if(1===t.nodeType||o)if(c=t[b]||(t[b]={}),(u=c[r])&&u[0]===p){if((l=u[1])===!0||l===i)return l===!0}else if(u=c[r]=[p],u[1]=e(t,n,s)||i,u[1]===!0)return!0}}function Tt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function Ct(e,t,n,r,i){var o,a=[],s=0,l=e.length,u=null!=t;for(;l>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),u&&t.push(s));return a}function Nt(e,t,n,r,i,o){return r&&!r[b]&&(r=Nt(r)),i&&!i[b]&&(i=Nt(i,o)),ut(function(o,a,s,l){var u,c,p,f=[],d=[],h=a.length,g=o||St(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:Ct(g,f,e,s,l),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,l),r){u=Ct(y,d),r(u,[],s,l),c=u.length;while(c--)(p=u[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){u=[],c=y.length;while(c--)(p=y[c])&&u.push(m[c]=p);i(null,y=[],u,l)}c=y.length;while(c--)(p=y[c])&&(u=i?F.call(o,p):f[c])>-1&&(o[u]=!(a[u]=p))}}else y=Ct(y===a?y.splice(h,y.length):y),i?i(null,a,y,l):M.apply(a,y)})}function kt(e){var t,n,r,i=e.length,a=o.relative[e[0].type],s=a||o.relative[" "],l=a?1:0,c=wt(function(e){return e===t},s,!0),p=wt(function(e){return F.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==u)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;i>l;l++)if(n=o.relative[e[l].type])f=[wt(Tt(f),n)];else{if(n=o.filter[e[l].type].apply(null,e[l].matches),n[b]){for(r=++l;i>r;r++)if(o.relative[e[r].type])break;return Nt(l>1&&Tt(f),l>1&&xt(e.slice(0,l-1).concat({value:" "===e[l-2].type?"*":""})).replace(z,"$1"),n,r>l&&kt(e.slice(l,r)),i>r&&kt(e=e.slice(r)),i>r&&xt(e))}f.push(n)}return Tt(f)}function Et(e,t){var n=0,r=t.length>0,a=e.length>0,s=function(s,l,c,p,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,C=u,N=s||a&&o.find.TAG("*",d&&l.parentNode||l),k=T+=null==C?1:Math.random()||.1;for(w&&(u=l!==f&&l,i=n);null!=(h=N[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,l,c)){p.push(h);break}w&&(T=k,i=++n)}r&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,r&&b!==v){g=0;while(m=t[g++])m(x,y,l,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=q.call(p));y=Ct(y)}M.apply(p,y),w&&!s&&y.length>0&&v+t.length>1&&at.uniqueSort(p)}return w&&(T=k,u=C),x};return r?ut(s):s}l=at.compile=function(e,t){var n,r=[],i=[],o=E[e+" "];if(!o){t||(t=bt(e)),n=t.length;while(n--)o=kt(t[n]),o[b]?r.push(o):i.push(o);o=E(e,Et(i,r))}return o};function St(e,t,n){var r=0,i=t.length;for(;i>r;r++)at(e,t[r],n);return n}function At(e,t,n,i){var a,s,u,c,p,f=bt(e);if(!i&&1===f.length){if(s=f[0]=f[0].slice(0),s.length>2&&"ID"===(u=s[0]).type&&r.getById&&9===t.nodeType&&h&&o.relative[s[1].type]){if(t=(o.find.ID(u.matches[0].replace(rt,it),t)||[])[0],!t)return n;e=e.slice(s.shift().value.length)}a=Q.needsContext.test(e)?0:s.length;while(a--){if(u=s[a],o.relative[c=u.type])break;if((p=o.find[c])&&(i=p(u.matches[0].replace(rt,it),V.test(s[0].type)&&t.parentNode||t))){if(s.splice(a,1),e=i.length&&xt(s),!e)return M.apply(n,i),n;break}}}return l(e,f)(i,t,!h,n,V.test(e)),n}o.pseudos.nth=o.pseudos.eq;function jt(){}jt.prototype=o.filters=o.pseudos,o.setFilters=new jt,r.sortStable=b.split("").sort(A).join("")===b,p(),[0,0].sort(A),r.detectDuplicates=S,x.find=at,x.expr=at.selectors,x.expr[":"]=x.expr.pseudos,x.unique=at.uniqueSort,x.text=at.getText,x.isXMLDoc=at.isXML,x.contains=at.contains}(e);var O={};function F(e){var t=O[e]={};return x.each(e.match(T)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?O[e]||F(e):x.extend({},e);var n,r,i,o,a,s,l=[],u=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=l.length,n=!0;l&&o>a;a++)if(l[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,l&&(u?u.length&&c(u.shift()):r?l=[]:p.disable())},p={add:function(){if(l){var t=l.length;(function i(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&p.has(n)||l.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=l.length:r&&(s=t,c(r))}return this},remove:function(){return l&&x.each(arguments,function(e,t){var r;while((r=x.inArray(t,l,r))>-1)l.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?x.inArray(e,l)>-1:!(!l||!l.length)},empty:function(){return l=[],o=0,this},disable:function(){return l=u=r=t,this},disabled:function(){return!l},lock:function(){return u=t,r||p.disable(),this},locked:function(){return!u},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!l||i&&!u||(n?u.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var a=o[0],s=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=g.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?g.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,l,u;if(r>1)for(s=Array(r),l=Array(r),u=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(a(t,u,n)).fail(o.reject).progress(a(t,l,s)):--i;return i||o.resolveWith(u,n),o.promise()}}),x.support=function(t){var n,r,o,s,l,u,c,p,f,d=a.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*")||[],r=d.getElementsByTagName("a")[0],!r||!r.style||!n.length)return t;s=a.createElement("select"),u=s.appendChild(a.createElement("option")),o=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t.getSetAttribute="t"!==d.className,t.leadingWhitespace=3===d.firstChild.nodeType,t.tbody=!d.getElementsByTagName("tbody").length,t.htmlSerialize=!!d.getElementsByTagName("link").length,t.style=/top/.test(r.getAttribute("style")),t.hrefNormalized="/a"===r.getAttribute("href"),t.opacity=/^0.5/.test(r.style.opacity),t.cssFloat=!!r.style.cssFloat,t.checkOn=!!o.value,t.optSelected=u.selected,t.enctype=!!a.createElement("form").enctype,t.html5Clone="<:nav></:nav>"!==a.createElement("nav").cloneNode(!0).outerHTML,t.inlineBlockNeedsLayout=!1,t.shrinkWrapBlocks=!1,t.pixelPosition=!1,t.deleteExpando=!0,t.noCloneEvent=!0,t.reliableMarginRight=!0,t.boxSizingReliable=!0,o.checked=!0,t.noCloneChecked=o.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!u.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}o=a.createElement("input"),o.setAttribute("value",""),t.input=""===o.getAttribute("value"),o.value="t",o.setAttribute("type","radio"),t.radioValue="t"===o.value,o.setAttribute("checked","t"),o.setAttribute("name","t"),l=a.createDocumentFragment(),l.appendChild(o),t.appendChecked=o.checked,t.checkClone=l.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip;for(f in x(t))break;return t.ownLast="0"!==f,x(function(){var n,r,o,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",l=a.getElementsByTagName("body")[0];l&&(n=a.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",l.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",o=d.getElementsByTagName("td"),o[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===o[0].offsetHeight,o[0].style.display="",o[1].style.display="none",t.reliableHiddenOffsets=p&&0===o[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",x.swap(l,null!=l.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===d.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(a.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(l.style.zoom=1)),l.removeChild(n),n=d=o=r=null)
}),n=s=l=u=r=o=null,t}({});var B=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,P=/([A-Z])/g;function R(e,n,r,i){if(x.acceptData(e)){var o,a,s=x.expando,l=e.nodeType,u=l?x.cache:e,c=l?e[s]:e[s]&&s;if(c&&u[c]&&(i||u[c].data)||r!==t||"string"!=typeof n)return c||(c=l?e[s]=p.pop()||x.guid++:s),u[c]||(u[c]=l?{}:{toJSON:x.noop}),("object"==typeof n||"function"==typeof n)&&(i?u[c]=x.extend(u[c],n):u[c].data=x.extend(u[c].data,n)),a=u[c],i||(a.data||(a.data={}),a=a.data),r!==t&&(a[x.camelCase(n)]=r),"string"==typeof n?(o=a[n],null==o&&(o=a[x.camelCase(n)])):o=a,o}}function W(e,t,n){if(x.acceptData(e)){var r,i,o=e.nodeType,a=o?x.cache:e,s=o?e[x.expando]:x.expando;if(a[s]){if(t&&(r=n?a[s]:a[s].data)){x.isArray(t)?t=t.concat(x.map(t,x.camelCase)):t in r?t=[t]:(t=x.camelCase(t),t=t in r?[t]:t.split(" ")),i=t.length;while(i--)delete r[t[i]];if(n?!I(r):!x.isEmptyObject(r))return}(n||(delete a[s].data,I(a[s])))&&(o?x.cleanData([e],!0):x.support.deleteExpando||a!=a.window?delete a[s]:a[s]=null)}}}x.extend({cache:{},noData:{applet:!0,embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(e){return e=e.nodeType?x.cache[e[x.expando]]:e[x.expando],!!e&&!I(e)},data:function(e,t,n){return R(e,t,n)},removeData:function(e,t){return W(e,t)},_data:function(e,t,n){return R(e,t,n,!0)},_removeData:function(e,t){return W(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&x.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),x.fn.extend({data:function(e,n){var r,i,o=null,a=0,s=this[0];if(e===t){if(this.length&&(o=x.data(s),1===s.nodeType&&!x._data(s,"parsedAttrs"))){for(r=s.attributes;r.length>a;a++)i=r[a].name,0===i.indexOf("data-")&&(i=x.camelCase(i.slice(5)),$(s,i,o[i]));x._data(s,"parsedAttrs",!0)}return o}return"object"==typeof e?this.each(function(){x.data(this,e)}):arguments.length>1?this.each(function(){x.data(this,e,n)}):s?$(s,e,x.data(s,e)):null},removeData:function(e){return this.each(function(){x.removeData(this,e)})}});function $(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(P,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:B.test(r)?x.parseJSON(r):r}catch(o){}x.data(e,n,r)}else r=t}return r}function I(e){var t;for(t in e)if(("data"!==t||!x.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}x.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=x._data(e,n),r&&(!i||x.isArray(r)?i=x._data(e,n,x.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),a=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return x._data(e,n)||x._data(e,n,{empty:x.Callbacks("once memory").add(function(){x._removeData(e,t+"queue"),x._removeData(e,n)})})}}),x.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?x.queue(this[0],e):n===t?this:this.each(function(){var t=x.queue(this,e,n);x._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=x.Deferred(),a=this,s=this.length,l=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=x._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(l));return l(),o.promise(n)}});var z,X,U=/[\t\r\n\f]/g,V=/\r/g,Y=/^(?:input|select|textarea|button|object)$/i,J=/^(?:a|area)$/i,G=/^(?:checked|selected)$/i,Q=x.support.getSetAttribute,K=x.support.input;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return e=x.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,l="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,l=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(l)for(t=(e||"").match(T)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(U," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,r="boolean"==typeof t;return x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,a=0,s=x(this),l=t,u=e.match(T)||[];while(o=u[a++])l=r?l:!s.hasClass(o),s[l?"addClass":"removeClass"](o)}else(n===i||"boolean"===n)&&(this.className&&x._data(this,"__className__",this.className),this.className=this.className||e===!1?"":x._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(U," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=x.isFunction(e),this.each(function(n){var o;1===this.nodeType&&(o=i?e.call(this,n,x(this).val()):e,null==o?o="":"number"==typeof o?o+="":x.isArray(o)&&(o=x.map(o,function(e){return null==e?"":e+""})),r=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=x.valHooks[o.type]||x.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(V,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=x.find.attr(e,"value");return null!=t?t:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,l=0>i?s:o?i:0;for(;s>l;l++)if(n=r[l],!(!n.selected&&l!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),a=i.length;while(a--)r=i[a],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,n,r){var o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===i?x.prop(e,n,r):(1===s&&x.isXMLDoc(e)||(n=n.toLowerCase(),o=x.attrHooks[n]||(x.expr.match.bool.test(n)?X:z)),r===t?o&&"get"in o&&null!==(a=o.get(e,n))?a:(a=x.find.attr(e,n),null==a?t:a):null!==r?o&&"set"in o&&(a=o.set(e,r,n))!==t?a:(e.setAttribute(n,r+""),r):(x.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(T);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.bool.test(n)?K&&Q||!G.test(n)?e[r]=!1:e[x.camelCase("default-"+n)]=e[r]=!1:x.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!x.isXMLDoc(e),a&&(n=x.propFix[n]||n,o=x.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var t=x.find.attr(e,"tabindex");return t?parseInt(t,10):Y.test(e.nodeName)||J.test(e.nodeName)&&e.href?0:-1}}}}),X={set:function(e,t,n){return t===!1?x.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&x.propFix[n]||n,n):e[x.camelCase("default-"+n)]=e[n]=!0,n}},x.each(x.expr.match.bool.source.match(/\w+/g),function(e,n){var r=x.expr.attrHandle[n]||x.find.attr;x.expr.attrHandle[n]=K&&Q||!G.test(n)?function(e,n,i){var o=x.expr.attrHandle[n],a=i?t:(x.expr.attrHandle[n]=t)!=r(e,n,i)?n.toLowerCase():null;return x.expr.attrHandle[n]=o,a}:function(e,n,r){return r?t:e[x.camelCase("default-"+n)]?n.toLowerCase():null}}),K&&Q||(x.attrHooks.value={set:function(e,n,r){return x.nodeName(e,"input")?(e.defaultValue=n,t):z&&z.set(e,n,r)}}),Q||(z={set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},x.expr.attrHandle.id=x.expr.attrHandle.name=x.expr.attrHandle.coords=function(e,n,r){var i;return r?t:(i=e.getAttributeNode(n))&&""!==i.value?i.value:null},x.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&r.specified?r.value:t},set:z.set},x.attrHooks.contenteditable={set:function(e,t,n){z.set(e,""===t?!1:t,n)}},x.each(["width","height"],function(e,n){x.attrHooks[n]={set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}}})),x.support.hrefNormalized||x.each(["href","src"],function(e,t){x.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}}),x.support.style||(x.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.support.enctype||(x.propFix.enctype="encoding"),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,n){return x.isArray(n)?e.checked=x.inArray(x(e).val(),n)>=0:t}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}function at(){try{return a.activeElement}catch(e){}}x.event={global:{},add:function(e,n,r,o,a){var s,l,u,c,p,f,d,h,g,m,y,v=x._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=x.guid++),(l=v.events)||(l=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof x===i||e&&x.event.triggered===e.type?t:x.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(T)||[""],u=n.length;while(u--)s=rt.exec(n[u])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),g&&(p=x.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=x.event.special[g]||{},d=x.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&x.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=l[g])||(h=l[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),x.event.global[g]=!0);e=null}},remove:function(e,t,n,r,i){var o,a,s,l,u,c,p,f,d,h,g,m=x.hasData(e)&&x._data(e);if(m&&(c=m.events)){t=(t||"").match(T)||[""],u=t.length;while(u--)if(s=rt.exec(t[u])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=x.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),l=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));l&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||x.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)x.event.remove(e,d+t[u],n,r,!0);x.isEmptyObject(c)&&(delete m.handle,x._removeData(e,"events"))}},trigger:function(n,r,i,o){var s,l,u,c,p,f,d,h=[i||a],g=v.call(n,"type")?n.type:n,m=v.call(n,"namespace")?n.namespace.split("."):[];if(u=f=i=i||a,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+x.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),l=0>g.indexOf(":")&&"on"+g,n=n[x.expando]?n:new x.Event(g,"object"==typeof n&&n),n.isTrigger=o?2:3,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:x.makeArray(r,[n]),p=x.event.special[g]||{},o||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!o&&!p.noBubble&&!x.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(u=u.parentNode);u;u=u.parentNode)h.push(u),f=u;f===(i.ownerDocument||a)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((u=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(x._data(u,"events")||{})[n.type]&&x._data(u,"handle"),s&&s.apply(u,r),s=l&&u[l],s&&x.acceptData(u)&&s.apply&&s.apply(u,r)===!1&&n.preventDefault();if(n.type=g,!o&&!n.isDefaultPrevented()&&(!p._default||p._default.apply(h.pop(),r)===!1)&&x.acceptData(i)&&l&&i[g]&&!x.isWindow(i)){f=i[l],f&&(i[l]=null),x.event.triggered=g;try{i[g]()}catch(y){}x.event.triggered=t,f&&(i[l]=f)}return n.result}},dispatch:function(e){e=x.event.fix(e);var n,r,i,o,a,s=[],l=g.call(arguments),u=(x._data(this,"events")||{})[e.type]||[],c=x.event.special[e.type]||{};if(l[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((x.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,l),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],l=n.delegateCount,u=e.target;if(l&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!=this;u=u.parentNode||this)if(1===u.nodeType&&(u.disabled!==!0||"click"!==e.type)){for(o=[],a=0;l>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?x(r,this).index(u)>=0:x.find(r,this,null,[u]).length),o[r]&&o.push(i);o.length&&s.push({elem:u,handlers:o})}return n.length>l&&s.push({elem:this,handlers:n.slice(l)}),s},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return e.target||(e.target=o.srcElement||a),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,o):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,o,s=n.button,l=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||a,o=i.documentElement,r=i.body,e.pageX=n.clientX+(o&&o.scrollLeft||r&&r.scrollLeft||0)-(o&&o.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(o&&o.scrollTop||r&&r.scrollTop||0)-(o&&o.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&l&&(e.relatedTarget=l===e.target?n.toElement:l),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==at()&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===at()&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},click:{trigger:function(){return x.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=a.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},x.Event=function(e,n){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&x.extend(this,n),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,t):new x.Event(e,n)},x.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.submitBubbles||(x.event.special.submit={setup:function(){return x.nodeName(this,"form")?!1:(x.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=x.nodeName(n,"input")||x.nodeName(n,"button")?n.form:t;r&&!x._data(r,"submitBubbles")&&(x.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),x._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&x.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return x.nodeName(this,"form")?!1:(x.event.remove(this,"._submit"),t)}}),x.support.changeBubbles||(x.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(x.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),x.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),x.event.simulate("change",this,e,!0)})),!1):(x.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!x._data(t,"changeBubbles")&&(x.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||x.event.simulate("change",this.parentNode,e,!0)}),x._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return x.event.remove(this,"._change"),!Z.test(this.nodeName)}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&a.addEventListener(e,r,!0)},teardown:function(){0===--n&&a.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return x().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=x.guid++)),this.each(function(){x.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,x(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){x.event.remove(this,e,r,n)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?x.event.trigger(e,n,r,!0):t}});var st=/^.[^:#\[\.,]*$/,lt=/^(?:parents|prev(?:Until|All))/,ut=x.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n=[],r=this,i=r.length;if("string"!=typeof e)return this.pushStack(x(e).filter(function(){for(t=0;i>t;t++)if(x.contains(r[t],this))return!0}));for(t=0;i>t;t++)x.find(e,r[t],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=this.selector?this.selector+" "+e:e,n},has:function(e){var t,n=x(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(x.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e||[],!0))},filter:function(e){return this.pushStack(ft(this,e||[],!1))},is:function(e){return!!ft(this,"string"==typeof e&&ut.test(e)?x(e):e||[],!1).length},closest:function(e,t){var n,r=0,i=this.length,o=[],a=ut.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(a?a.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?x.inArray(this[0],x(e)):x.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(ct[e]||(i=x.unique(i)),lt.test(e)&&(i=i.reverse())),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!x(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(st.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return x.inArray(e,t)>=0!==n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Ct=/^(?:checkbox|radio)$/i,Nt=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:x.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(a),Dt=jt.appendChild(a.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===t?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||a).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Lt(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(Ft(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&_t(Ft(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&x.cleanData(Ft(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&x.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!x.support.htmlSerialize&&mt.test(e)||!x.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(x.cleanData(Ft(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(r&&r.parentNode!==i&&(r=this.nextSibling),x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=d.apply([],e);var r,i,o,a,s,l,u=0,c=this.length,p=this,f=c-1,h=e[0],g=x.isFunction(h);if(g||!(1>=c||"string"!=typeof h||x.support.checkClone)&&Nt.test(h))return this.each(function(r){var i=p.eq(r);g&&(e[0]=h.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(l=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),r=l.firstChild,1===l.childNodes.length&&(l=r),r)){for(a=x.map(Ft(l,"script"),Ht),o=a.length;c>u;u++)i=l,u!==f&&(i=x.clone(i,!0,!0),o&&x.merge(a,Ft(i,"script"))),t.call(this[u],i,u);if(o)for(s=a[a.length-1].ownerDocument,x.map(a,qt),u=0;o>u;u++)i=a[u],kt.test(i.type||"")&&!x._data(i,"globalEval")&&x.contains(s,i)&&(i.src?x._evalUrl(i.src):x.globalEval((i.text||i.textContent||i.innerHTML||"").replace(St,"")));l=r=null}return this}});function Lt(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function Ht(e){return e.type=(null!==x.find.attr(e,"type"))+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function _t(e,t){var n,r=0;for(;null!=(n=e[r]);r++)x._data(n,"globalEval",!t||x._data(t[r],"globalEval"))}function Mt(e,t){if(1===t.nodeType&&x.hasData(e)){var n,r,i,o=x._data(e),a=x._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)x.event.add(t,n,s[n][r])}a.data&&(a.data=x.extend({},a.data))}}function Ot(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!x.support.noCloneEvent&&t[x.expando]){i=x._data(t);for(r in i.events)x.removeEvent(t,r,i.handle);t.removeAttribute(x.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),x.support.html5Clone&&e.innerHTML&&!x.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Ct.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=0,i=[],o=x(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),x(o[r])[t](n),h.apply(i,n.get());return this.pushStack(i)}});function Ft(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||x.nodeName(o,n)?s.push(o):x.merge(s,Ft(o,n));return n===t||n&&x.nodeName(e,n)?x.merge([e],s):s}function Bt(e){Ct.test(e.type)&&(e.defaultChecked=e.checked)}x.extend({clone:function(e,t,n){var r,i,o,a,s,l=x.contains(e.ownerDocument,e);if(x.support.html5Clone||x.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(x.support.noCloneEvent&&x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(r=Ft(o),s=Ft(e),a=0;null!=(i=s[a]);++a)r[a]&&Ot(i,r[a]);if(t)if(n)for(s=s||Ft(e),r=r||Ft(o),a=0;null!=(i=s[a]);a++)Mt(i,r[a]);else Mt(e,o);return r=Ft(o,"script"),r.length>0&&_t(r,!l&&Ft(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,l,u,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===x.type(o))x.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),l=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[l]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!x.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!x.support.tbody){o="table"!==l||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)x.nodeName(u=o.childNodes[i],"tbody")&&!u.childNodes.length&&o.removeChild(u)}x.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),x.support.appendChecked||x.grep(Ft(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===x.inArray(o,r))&&(a=x.contains(o.ownerDocument,o),s=Ft(f.appendChild(o),"script"),a&&_t(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,l=x.expando,u=x.cache,c=x.support.deleteExpando,f=x.event.special;for(;null!=(n=e[s]);s++)if((t||x.acceptData(n))&&(o=n[l],a=o&&u[o])){if(a.events)for(r in a.events)f[r]?x.event.remove(n,r):x.removeEvent(n,r,a.handle);
u[o]&&(delete u[o],c?delete n[l]:typeof n.removeAttribute!==i?n.removeAttribute(l):n[l]=null,p.push(o))}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})}}),x.fn.extend({wrapAll:function(e){if(x.isFunction(e))return this.each(function(t){x(this).wrapAll(e.call(this,t))});if(this[0]){var t=x(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+w+")(.*)$","i"),Yt=RegExp("^("+w+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+w+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=x._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=x._data(r,"olddisplay",ln(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&x._data(r,"olddisplay",i?n:x.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}x.fn.extend({css:function(e,n){return x.access(this,function(e,n,r){var i,o,a={},s=0;if(x.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=x.css(e,n[s],!1,o);return a}return r!==t?x.style(e,n,r):x.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:nn(this))?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":x.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,l=x.camelCase(n),u=e.style;if(n=x.cssProps[l]||(x.cssProps[l]=tn(u,l)),s=x.cssHooks[n]||x.cssHooks[l],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:u[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(x.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||x.cssNumber[l]||(r+="px"),x.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(u[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{u[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,l=x.camelCase(n);return n=x.cssProps[l]||(x.cssProps[l]=tn(e.style,l)),s=x.cssHooks[n]||x.cssHooks[l],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||x.isNumeric(o)?o||0:a):a}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s.getPropertyValue(n)||s[n]:t,u=e.style;return s&&(""!==l||x.contains(e.ownerDocument,e)||(l=x.style(e,n)),Yt.test(l)&&Ut.test(n)&&(i=u.width,o=u.minWidth,a=u.maxWidth,u.minWidth=u.maxWidth=u.width=l,l=s.width,u.width=i,u.minWidth=o,u.maxWidth=a)),l}):a.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),l=s?s[n]:t,u=e.style;return null==l&&u&&u[n]&&(l=u[n]),Yt.test(l)&&!zt.test(n)&&(i=u.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),u.left="fontSize"===n?"1em":l,l=u.pixelLeft+"px",u.left=i,a&&(o.left=a)),""===l?"auto":l});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=x.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=x.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=x.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=x.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=x.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function ln(e){var t=a,n=Gt[e];return n||(n=un(e,t),"none"!==n&&n||(Pt=(Pt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=un(e,t),Pt.detach()),Gt[e]=n),n}function un(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,n){x.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(x.css(e,"display"))?x.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x.support.opacity||(x.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=x.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===x.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,n){return n?x.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,n){x.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?x(e).position()[n]+"px":r):t}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!x.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||x.css(e,"display"))},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(x.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Ct.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),x.param=function(e,n){var r,i=[],o=function(e,t){t=x.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var mn,yn,vn=x.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Cn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Nn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=x.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=o.href}catch(Ln){yn=a.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(T)||[];if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(l){var u;return o[l]=!0,x.each(e[l]||[],function(e,l){var c=l(n,r,i);return"string"!=typeof c||a||o[c]?a?!(u=c):t:(n.dataTypes.unshift(c),s(c),!1)}),u}return s(n.dataTypes[0])||!o["*"]&&s("*")}function _n(e,n){var r,i,o=x.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,l=e.indexOf(" ");return l>=0&&(i=e.slice(l,e.length),e=e.slice(0,l)),x.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&x.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?x("<div>").append(x.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Cn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?_n(_n(e,x.ajaxSettings),t):_n(x.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,l,u,c,p=x.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),g=x.Callbacks("once memory"),m=p.statusCode||{},y={},v={},b=0,w="canceled",C={readyState:0,getResponseHeader:function(e){var t;if(2===b){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===b?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return b||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return b||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>b)for(t in e)m[t]=[m[t],e[t]];else C.always(e[C.status]);return this},abort:function(e){var t=e||w;return u&&u.abort(t),k(0,t),this}};if(h.promise(C).complete=g.add,C.success=C.done,C.error=C.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=x.trim(p.dataType||"*").toLowerCase().match(T)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?"80":"443"))===(mn[3]||("http:"===mn[1]?"80":"443")))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=x.param(p.data,p.traditional)),qn(An,p,n,C),2===b)return C;l=p.global,l&&0===x.active++&&x.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Nn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(x.lastModified[o]&&C.setRequestHeader("If-Modified-Since",x.lastModified[o]),x.etag[o]&&C.setRequestHeader("If-None-Match",x.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&C.setRequestHeader("Content-Type",p.contentType),C.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)C.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,C,p)===!1||2===b))return C.abort();w="abort";for(i in{success:1,error:1,complete:1})C[i](p[i]);if(u=qn(jn,p,n,C)){C.readyState=1,l&&d.trigger("ajaxSend",[C,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){C.abort("timeout")},p.timeout));try{b=1,u.send(y,k)}catch(N){if(!(2>b))throw N;k(-1,N)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,N=n;2!==b&&(b=2,s&&clearTimeout(s),u=t,a=i||"",C.readyState=e>0?4:0,c=e>=200&&300>e||304===e,r&&(w=Mn(p,C,r)),w=On(p,w,C,c),c?(p.ifModified&&(T=C.getResponseHeader("Last-Modified"),T&&(x.lastModified[o]=T),T=C.getResponseHeader("etag"),T&&(x.etag[o]=T)),204===e||"HEAD"===p.type?N="nocontent":304===e?N="notmodified":(N=w.state,y=w.data,v=w.error,c=!v)):(v=N,(e||!N)&&(N="error",0>e&&(e=0))),C.status=e,C.statusText=(n||N)+"",c?h.resolveWith(f,[y,N,C]):h.rejectWith(f,[C,N,v]),C.statusCode(m),m=t,l&&d.trigger(c?"ajaxSuccess":"ajaxError",[C,p,c?y:v]),g.fireWith(f,[C,N]),l&&(d.trigger("ajaxComplete",[C,p]),--x.active||x.event.trigger("ajaxStop")))}return C},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,n){return x.get(e,t,n,"script")}}),x.each(["get","post"],function(e,n){x[n]=function(e,r,i,o){return x.isFunction(r)&&(o=o||i,i=r,r=t),x.ajax({url:e,type:n,dataType:o,data:r,success:i})}});function Mn(e,n,r){var i,o,a,s,l=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in l)if(l[s]&&l[s].test(o)){u.unshift(s);break}if(u[0]in r)a=u[0];else{for(s in r){if(!u[0]||e.converters[s+" "+u[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==u[0]&&u.unshift(a),r[a]):t}function On(e,t,n,r){var i,o,a,s,l,u={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)u[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!l&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),l=o,o=c.shift())if("*"===o)o=l;else if("*"!==l&&l!==o){if(a=u[l+" "+o]||u["* "+o],!a)for(i in u)if(s=i.split(" "),s[1]===o&&(a=u[l+" "+s[0]]||u["* "+s[0]])){a===!0?a=u[i]:u[i]!==!0&&(o=s[0],c.unshift(s[1]));break}if(a!==!0)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(p){return{state:"parsererror",error:a?p:"No conversion from "+l+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),x.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=a.head||x("head")[0]||a.documentElement;return{send:function(t,i){n=a.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var Fn=[],Bn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Fn.pop()||x.expando+"_"+vn++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,l=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return l||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=x.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,l?n[l]=n[l].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||x.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,Fn.push(o)),s&&x.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}x.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=x.ajaxSettings.xhr(),x.support.cors=!!Rn&&"withCredentials"in Rn,Rn=x.support.ajax=!!Rn,Rn&&x.ajaxTransport(function(n){if(!n.crossDomain||x.support.cors){var r;return{send:function(i,o){var a,s,l=n.xhr();if(n.username?l.open(n.type,n.url,n.async,n.username,n.password):l.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)l[s]=n.xhrFields[s];n.mimeType&&l.overrideMimeType&&l.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)l.setRequestHeader(s,i[s])}catch(u){}l.send(n.hasContent&&n.data||null),r=function(e,i){var s,u,c,p;try{if(r&&(i||4===l.readyState))if(r=t,a&&(l.onreadystatechange=x.noop,$n&&delete Pn[a]),i)4!==l.readyState&&l.abort();else{p={},s=l.status,u=l.getAllResponseHeaders(),"string"==typeof l.responseText&&(p.text=l.responseText);try{c=l.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,u)},n.async?4===l.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},x(e).unload($n)),Pn[a]=r),l.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+w+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n=this.createTween(e,t),r=n.cur(),i=Yn.exec(t),o=i&&i[3]||(x.cssNumber[e]?"":"px"),a=(x.cssNumber[e]||"px"!==o&&+r)&&Yn.exec(x.css(n.elem,e)),s=1,l=20;if(a&&a[3]!==o){o=o||a[3],i=i||[],a=+r||1;do s=s||".5",a/=s,x.style(n.elem,e,a+o);while(s!==(s=n.cur()/r)&&1!==s&&--l)}return i&&(a=n.start=+a||+r||0,n.unit=o,n.end=i[1]?a+(i[1]+1)*i[2]:+i[2]),n}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=x.now()}function Zn(e,t,n){var r,i=(Qn[t]||[]).concat(Qn["*"]),o=0,a=i.length;for(;a>o;o++)if(r=i[o].call(n,t,e))return r}function er(e,t,n){var r,i,o=0,a=Gn.length,s=x.Deferred().always(function(){delete l.elem}),l=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,u.startTime+u.duration-t),r=n/u.duration||0,o=1-r,a=0,l=u.tweens.length;for(;l>a;a++)u.tweens[a].run(o);return s.notifyWith(e,[u,o,n]),1>o&&l?n:(s.resolveWith(e,[u]),!1)},u=s.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,u.opts,t,n,u.opts.specialEasing[t]||u.opts.easing);return u.tweens.push(r),r},stop:function(t){var n=0,r=t?u.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)u.tweens[n].run(1);return t?s.resolveWith(e,[u,t]):s.rejectWith(e,[u,t]),this}}),c=u.props;for(tr(c,u.opts.specialEasing);a>o;o++)if(r=Gn[o].call(u,e,c,u.opts))return r;return x.map(c,Zn,u),x.isFunction(u.opts.start)&&u.opts.start.call(e,u),x.fx.timer(x.extend(l,{elem:e,anim:u,queue:u.opts.queue})),u.progress(u.opts.progress).done(u.opts.done,u.opts.complete).fail(u.opts.fail).always(u.opts.always)}function tr(e,t){var n,r,i,o,a;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),a=x.cssHooks[r],a&&"expand"in a){o=a.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(er,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,l,u=this,c={},p=e.style,f=e.nodeType&&nn(e),d=x._data(e,"fxshow");n.queue||(s=x._queueHooks(e,"fx"),null==s.unqueued&&(s.unqueued=0,l=s.empty.fire,s.empty.fire=function(){s.unqueued||l()}),s.unqueued++,u.always(function(){u.always(function(){s.unqueued--,x.queue(e,"fx").length||s.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[p.overflow,p.overflowX,p.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(x.support.inlineBlockNeedsLayout&&"inline"!==ln(e.nodeName)?p.zoom=1:p.display="inline-block")),n.overflow&&(p.overflow="hidden",x.support.shrinkWrapBlocks||u.always(function(){p.overflow=n.overflow[0],p.overflowX=n.overflow[1],p.overflowY=n.overflow[2]}));for(r in t)if(i=t[r],Vn.exec(i)){if(delete t[r],o=o||"toggle"===i,i===(f?"hide":"show"))continue;c[r]=d&&d[r]||x.style(e,r)}if(!x.isEmptyObject(c)){d?"hidden"in d&&(f=d.hidden):d=x._data(e,"fxshow",{}),o&&(d.hidden=!f),f?x(e).show():u.done(function(){x(e).hide()}),u.done(function(){var t;x._removeData(e,"fxshow");for(t in c)x.style(e,t,c[t])});for(r in c)a=Zn(f?d[r]:0,r,u),r in d||(d[r]=a.start,f&&(a.end=a.start,a.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}x.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),a=function(){var t=er(this,x.extend({},e),o);(i||x._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=x.timers,a=x._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=x._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,a=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.stop&&i.stop.call(this,!0),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=rr.prototype.init,x.fx.tick=function(){var e,n=x.timers,r=0;for(Xn=x.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||x.fx.stop(),Xn=t},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){Un||(Un=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(Un),Un=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){x.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,x.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},x.offset={setOffset:function(e,t,n){var r=x.css(e,"position");"static"===r&&(e.style.position="relative");var i=x(e),o=i.offset(),a=x.css(e,"top"),s=x.css(e,"left"),l=("absolute"===r||"fixed"===r)&&x.inArray("auto",[a,s])>-1,u={},c={},p,f;l?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),x.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(u.top=t.top-o.top+p),null!=t.left&&(u.left=t.left-o.left+f),"using"in t?t.using.call(e,u):i.css(u)}},x.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===x.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(n=e.offset()),n.top+=x.css(e[0],"borderTopWidth",!0),n.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-x.css(r,"marginTop",!0),left:t.left-n.left-x.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);x.fn[e]=function(i){return x.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?x(a).scrollLeft():o,r?o:x(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return x.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}x.each({Height:"height",Width:"width"},function(e,n){x.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){x.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return x.access(this,function(n,r,i){var o;return x.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?x.css(n,r,s):x.style(n,r,i,s)},n,a?i:t,a,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&module&&"object"==typeof module.exports?module.exports=x:(e.jQuery=e.$=x,"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}))})(window);

(function(){var fieldSelection={getSelection:function(){var e=this.jquery?this[0]:this;return(('selectionStart'in e&&function(){var l=e.selectionEnd-e.selectionStart;return{start:e.selectionStart,end:e.selectionEnd,length:l,text:e.value.substr(e.selectionStart,l)};})||(document.selection&&function(){e.focus();var r=document.selection.createRange();if(r==null){return{start:0,end:e.value.length,length:0}}
var re=e.createTextRange();var rc=re.duplicate();re.moveToBookmark(r.getBookmark());rc.setEndPoint('EndToStart',re);return{start:rc.text.length,end:rc.text.length+r.text.length,length:r.text.length,text:r.text};})||function(){return{start:0,end:e.value.length,length:0};})();},replaceSelection:function(){var e=this.jquery?this[0]:this;var text=arguments[0]||'';return(('selectionStart'in e&&function(){e.value=e.value.substr(0,e.selectionStart)+text+e.value.substr(e.selectionEnd,e.value.length);return this;})||(document.selection&&function(){e.focus();document.selection.createRange().text=text;return this;})||function(){e.value+=text;return this;})();}};jQuery.each(fieldSelection,function(i){jQuery.fn[i]=this;});})();/*!
jQuery UI Virtual Keyboard
Version 1.17.7

Author: Jeremy Satterfield
Modified: Rob Garrison (Mottie on github)
-----------------------------------------
Licensed under the MIT License

Caret code modified from jquery.caret.1.02.js
Licensed under the MIT License:
http://www.opensource.org/licenses/mit-license.php
-----------------------------------------

An on-screen virtual keyboard embedded within the browser window which
will popup when a specified entry field is focused. The user can then
type and preview their input before Accepting or Canceling.

As a plugin to jQuery UI styling and theme will automatically
match that used by jQuery UI with the exception of the required
CSS listed below.

Requires:
	jQuery
	jQuery UI (position utility only) & CSS

Usage:
	$('input[type=text], input[type=password], textarea')
		.keyboard({
			layout:"qwerty",
			customLayout: {
				'default': [
					"q w e r t y {bksp}",
					"s a m p l e {shift}",
					"{accept} {space} {cancel}"
				],
				'shift' : [
					"Q W E R T Y {bksp}",
					"S A M P L E {shift}",
					"{accept} {space} {cancel}"
				]
			}
		});

Options:
	layout
		[String] specify which keyboard layout to use
		qwerty - Standard QWERTY layout (Default)
		international - US international layout
		alpha  - Alphabetical layout
		dvorak - Dvorak Simplified layout
		num    - Numerical (ten-key) layout
		custom - Uses a custom layout as defined by the customLayout option

	customLayout
		[Object] Specify a custom layout
			An Object containing a set of key:value pairs, each key is a keyset.
			The key can be one to four rows (default, shifted, alt and alt-shift) or any number of meta key sets (meta1, meta2, etc).
			The value is an array with string elements of which each defines a new keyboard row.
			Each string element must have each character or key seperated by a space.
			To include an action key, select the desired one from the list below, or define your own by adding it to the $.keyboard.keyaction variable
			In the list below where two special/"Action" keys are shown, both keys have the same action but different appearances (abbreviated/full name keys).
			Special/"Action" keys include:
				{a}, {accept} - Updates element value and closes keyboard
				{alt},{altgr} - AltGr for International keyboard
				{b}, {bksp}   - Backspace
				{c}, {cancel} - Clears changes and closes keyboard
				{clear}       - Clear input window - used in num pad
				{combo}       - Toggle combo (diacritic) key
				{dec}         - Decimal for numeric entry, only allows one decimal (optional use in num pad)
				{default}     - Switch to the default keyset
				{e}, {enter}  - Return/New Line
				{empty}       - empty (blank) key
				{lock}        - Caps lock key
				{meta#}       - Meta keys that change the key set (# can be any integer)
				{next}        - Switch to next keyboard input/textarea
				{prev}        - Switch to previous keyboard input/textarea
				{s}, {shift}  - Shift
				{sign}        - Change sign of numeric entry (positive or negative)
				{sp:#}        - Replace # with a numerical value, adds blank space, value of 1 ~ width of one key
				{space}       - Spacebar
				{t}, {tab}    - Tab

CSS:
	Please see the keyboard.css file
*/
/*jshint browser:true, jquery:true, unused:false */
;(function($){
"use strict";
$.keyboard = function(el, options){
	var base = this, o;

	// Access to jQuery and DOM versions of element
	base.$el = $(el);
	base.el = el;

	// Add a reverse reference to the DOM object
	base.$el.data("keyboard", base);

	base.init = function(){
		base.options = o = $.extend(true, {}, $.keyboard.defaultOptions, options);

		// Shift and Alt key toggles, sets is true if a layout has more than one keyset - used for mousewheel message
		base.shiftActive = base.altActive = base.metaActive = base.sets = base.capsLock = false;
		base.lastKeyset = [false, false, false]; // [shift, alt, meta]
		// Class names of the basic key set - meta keysets are handled by the keyname
		base.rows = [ '', '-shift', '-alt', '-alt-shift' ];
		base.acceptedKeys = [];
		base.mappedKeys = {}; // for remapping manually typed in keys
		$('<!--[if lte IE 8]><script>jQuery("body").addClass("oldie");</script><![endif]--><!--[if IE]><script>jQuery("body").addClass("ie");</script><![endif]-->').appendTo('body').remove();
		base.msie = $('body').hasClass('oldie'); // Old IE flag, used for caret positioning
		base.allie = $('body').hasClass('ie');
		base.inPlaceholder = base.$el.attr('placeholder') || '';
		base.watermark = (typeof(document.createElement('input').placeholder) !== 'undefined' && base.inPlaceholder !== ''); // html 5 placeholder/watermark
		base.regex = $.keyboard.comboRegex; // save default regex (in case loading another layout changes it)
		base.decimal = ( /^\./.test(o.display.dec) ) ? true : false; // determine if US "." or European "," system being used
		// convert mouse repeater rate (characters per second) into a time in milliseconds.
		base.repeatTime = 1000/(o.repeatRate || 20);

		// Check if caret position is saved when input is hidden or loses focus
		// (*cough* all versions of IE and I think Opera has/had an issue as well
		base.temp = $('<input style="position:absolute;left:-9999em;top:-9999em;" type="text" value="testing">').appendTo('body').caret(3,3);
		// Also save caret position of the input if it is locked
		base.checkCaret = (o.lockInput || base.temp.hide().show().caret().start !== 3 ) ? true : false;
		base.temp.remove();
		base.lastCaret = { start:0, end:0 };

		base.temp = [ '', 0, 0 ]; // used when building the keyboard - [keyset element, row, index]

		// Bind events
		$.each('initialized beforeVisible visible hidden canceled accepted beforeClose'.split(' '), function(i,f){
			if ($.isFunction(o[f])){
				base.$el.bind(f + '.keyboard', o[f]);
			}
		});

		// Close with esc key & clicking outside
		if (o.alwaysOpen) { o.stayOpen = true; }
		$(document).bind('mousedown.keyboard keyup.keyboard touchstart.keyboard', function(e){
			if (base.opening) { return; }
			base.escClose(e);
			// needed for IE to allow switching between keyboards smoothly
			if ( e.target && $(e.target).hasClass('ui-keyboard-input') ) {
				var kb = $(e.target).data('keyboard');
				if (kb && kb.options.openOn) {
					kb.focusOn();
				}
			}
		});

		// Display keyboard on focus
		base.$el
			.addClass('ui-keyboard-input ' + o.css.input)
			.attr({ 'aria-haspopup' : 'true', 'role' : 'textbox' });

		// add disabled/readonly class - dynamically updated on reveal
		if (base.$el.is(':disabled') || (base.$el.attr('readonly') && !base.$el.hasClass('ui-keyboard-lockedinput'))) {
			base.$el.addClass('ui-keyboard-nokeyboard');
		}
		if (o.openOn) {
			base.$el.bind(o.openOn + '.keyboard', function(){
				base.focusOn();
			});
		}

		// Add placeholder if not supported by the browser
		if (!base.watermark && base.$el.val() === '' && base.inPlaceholder !== '' && base.$el.attr('placeholder') !== '') {
			base.$el
				.addClass('ui-keyboard-placeholder') // css watermark style (darker text)
				.val( base.inPlaceholder );
		}

		base.$el.trigger( 'initialized.keyboard', [ base, base.el ] );

		// initialized with keyboard open
		if (o.alwaysOpen) {
			base.reveal();
		}

	};

	base.focusOn = function(){
		if (o.usePreview && base.$el.is(':visible')) {
			// caret position is always 0,0 in webkit; and nothing is focused at this point... odd
			// save caret position in the input to transfer it to the preview
			base.lastCaret = base.$el.caret();
		}
		if (!base.isVisible() || o.alwaysOpen) {
			clearTimeout(base.timer);
			base.reveal();
		}
	};

	base.reveal = function(){
		base.opening = true;
		// close all keyboards
		$('.ui-keyboard:not(.ui-keyboard-always-open)').hide();

		// Don't open if disabled
		if (base.$el.is(':disabled') || (base.$el.attr('readonly') && !base.$el.hasClass('ui-keyboard-lockedinput'))) {
			base.$el.addClass('ui-keyboard-nokeyboard');
			return;
		} else {
			base.$el.removeClass('ui-keyboard-nokeyboard');
		}

		// Unbind focus to prevent recursion - openOn may be empty if keyboard is opened externally
		if (o.openOn) {
			base.$el.unbind( o.openOn + '.keyboard' );
		}

		// build keyboard if it doesn't exist
		if (typeof(base.$keyboard) === 'undefined') { base.startup(); }

		// ui-keyboard-has-focus is applied in case multiple keyboards have alwaysOpen = true and are stacked
		$('.ui-keyboard-has-focus').removeClass('ui-keyboard-has-focus');
		$('.ui-keyboard-input-current').removeClass('ui-keyboard-input-current');

		base.$el.addClass('ui-keyboard-input-current');
		base.isCurrent(true);

		// clear watermark
		if (!base.watermark && base.el.value === base.inPlaceholder) {
			base.$el
				.removeClass('ui-keyboard-placeholder')
				.val('');
		}
		// save starting content, in case we cancel
		base.originalContent = base.$el.val();
		base.$preview.val( base.originalContent );

		// disable/enable accept button
		if (o.acceptValid) { base.checkValid(); }

		// get single target position || target stored in element data (multiple targets) || default, at the element
		var p, s;
		base.position = o.position;
		base.position.of = base.position.of || base.$el.data('keyboardPosition') || base.$el;
		base.position.collision = (o.usePreview) ? base.position.collision || 'fit fit' : 'flip flip';

		if (o.resetDefault) {
			base.shiftActive = base.altActive = base.metaActive = false;
			base.showKeySet();
		}

		// basic positioning before it is set by position utility
		base.$keyboard.css({ position: 'absolute', left: 0, top: 0 });

		// beforeVisible event
		base.$el.trigger( 'beforeVisible.keyboard', [ base, base.el ] );

		// show keyboard
		base.$keyboard
			.addClass('ui-keyboard-has-focus')
			.show();

		// adjust keyboard preview window width - save width so IE won't keep expanding (fix issue #6)
		if (o.usePreview && base.msie) {
			if (typeof base.width === 'undefined') {
				base.$preview.hide(); // preview is 100% browser width in IE7, so hide the damn thing
				base.width = Math.ceil(base.$keyboard.width()); // set input width to match the widest keyboard row
				base.$preview.show();
			}
			base.$preview.width(base.width);
		}

		// position after keyboard is visible (required for UI position utility) and appropriately sized
//		if ($.ui.position) {
//			base.$keyboard.position(base.position);
//		}

		if (o.initialFocus) {
			base.$preview.focus();
		}

		base.checkDecimal();

		// get preview area line height
		// add roughly 4px to get line height from font height, works well for font-sizes from 14-36px - needed for textareas
		base.lineHeight = parseInt( base.$preview.css('lineHeight'), 10) || parseInt(base.$preview.css('font-size') ,10) + 4;

		if (o.caretToEnd) {
			s = base.originalContent.length;
			base.lastCaret = {
				start: s,
				end  : s
			};
		}

		// IE caret haxx0rs
		if (base.allie){
			// ensure caret is at the end of the text (needed for IE)
			s = base.lastCaret.start || base.originalContent.length;
			p = { start: s, end: s };
			if (!base.lastCaret) { base.lastCaret = p; } // set caret at end of content, if undefined
			if (base.lastCaret.end === 0 && base.lastCaret.start > 0) { base.lastCaret.end = base.lastCaret.start; } // sometimes end = 0 while start is > 0
			if (base.lastCaret.start < 0) { base.lastCaret = p; } // IE will have start -1, end of 0 when not focused (see demo: http://jsfiddle.net/Mottie/fgryQ/3/).
		}

		// opening keyboard flag; delay allows switching between keyboards without immediately closing the keyboard
		setTimeout(function(){
			base.opening = false;
			if (o.initialFocus) {
				base.$preview.caret( base.lastCaret.start, base.lastCaret.end );
			}
			base.$el.trigger( 'visible.keyboard', [ base, base.el ] );
		}, 10);
		// return base to allow chaining in typing extension
		return base;
	};

	base.startup = function(){
		base.$keyboard = base.buildKeyboard();
		base.$allKeys = base.$keyboard.find('button.ui-keyboard-button');
		base.preview = base.$preview[0];
		base.$decBtn = base.$keyboard.find('.ui-keyboard-dec');
		base.wheel = $.isFunction( $.fn.mousewheel ); // is mousewheel plugin loaded?
		// keyCode of keys always allowed to be typed - caps lock, page up & down, end, home, arrow, insert & delete keys
		base.alwaysAllowed = [20,33,34,35,36,37,38,39,40,45,46];
		if (o.enterNavigation) { base.alwaysAllowed.push(13); } // add enter to allowed keys
		base.$preview
			.bind('keypress.keyboard', function(e){
				var k = base.lastKey = String.fromCharCode(e.charCode || e.which);
				base.$lastKey = []; // not a virtual keyboard key
				if (base.checkCaret) { base.lastCaret = base.$preview.caret(); }

				// update caps lock - can only do this while typing =(
				base.capsLock = (((k >= 65 && k <= 90) && !e.shiftKey) || ((k >= 97 && k <= 122) && e.shiftKey)) ? true : false;

				// restrict input - keyCode in keypress special keys: see http://www.asquare.net/javascript/tests/KeyCode.html
				if (o.restrictInput) {
					// allow navigation keys to work - Chrome doesn't fire a keypress event (8 = bksp)
					if ( (e.which === 8 || e.which === 0) && $.inArray( e.keyCode, base.alwaysAllowed ) ) { return; }
					if ($.inArray(k, base.acceptedKeys) === -1) { e.preventDefault(); } // quick key check
				} else if ( (e.ctrlKey || e.metaKey) && (e.which === 97 || e.which === 99 || e.which === 118 || (e.which >= 120 && e.which <=122)) ) {
					// Allow select all (ctrl-a:97), copy (ctrl-c:99), paste (ctrl-v:118) & cut (ctrl-x:120) & redo (ctrl-y:121)& undo (ctrl-z:122); meta key for mac
					return;
				}
				// Mapped Keys - allows typing on a regular keyboard and the mapped key is entered
				// Set up a key in the layout as follows: "m(a):label"; m = key to map, (a) = actual keyboard key to map to (optional), ":label" = title/tooltip (optional)
				// example: \u0391 or \u0391(A) or \u0391:alpha or \u0391(A):alpha
				if (base.hasMappedKeys) {
					if (base.mappedKeys.hasOwnProperty(k)){
						base.lastKey = base.mappedKeys[k];
						base.insertText( base.lastKey );
						e.preventDefault();
					}
				}
				base.checkMaxLength();

			})
			.bind('keyup.keyboard', function(e){
				switch (e.which) {
					// Insert tab key
					case 9 :
						// Added a flag to prevent from tabbing into an input, keyboard opening, then adding the tab to the keyboard preview
						// area on keyup. Sadly it still happens if you don't release the tab key immediately because keydown event auto-repeats
						if (base.tab && o.tabNavigation && !o.lockInput) {
							base.shiftActive = e.shiftKey;
							$.keyboard.keyaction.tab(base);
							base.tab = false;
						} else {
							e.preventDefault();
						}
						break;

					// Escape will hide the keyboard
					case 27:
						base.close();
						return false;
				}

				// throttle the check combo function because fast typers will have an incorrectly positioned caret
				clearTimeout(base.throttled);
				base.throttled = setTimeout(function(){
					// fix error in OSX? see issue #102
					if (base.isVisible()) {
						base.checkCombos();
					}
				}, 100);

				base.checkMaxLength();
				// change callback is no longer bound to the input element as the callback could be
				// called during an external change event with all the necessary parameters (issue #157)
				if ($.isFunction(o.change)){ o.change( $.Event("change"), base, base.el ); }
				base.$el.trigger( 'change.keyboard', [ base, base.el ] );
			})
			.bind('keydown.keyboard', function(e){
				switch (e.which) {
					// prevent tab key from leaving the preview window
					case 9 :
						if (o.tabNavigation) {
							// allow tab to pass through - tab to next input/shift-tab for prev
							base.tab = true;
							return false;
						} else {
							base.tab = true; // see keyup comment above
							return false;
						}
						break; // adding a break here to make jsHint happy

					case 13:
						$.keyboard.keyaction.enter(base, null, e);
						break;

					// Show capsLock
					case 20:
						base.shiftActive = base.capsLock = !base.capsLock;
						base.showKeySet(this);
						break;

					case 86:
						// prevent ctrl-v/cmd-v
						if (e.ctrlKey || e.metaKey) {
							if (o.preventPaste) { e.preventDefault(); return; }
							base.checkCombos(); // check pasted content
						}
						break;
				}
			})
			.bind('mouseup.keyboard touchend.keyboard', function(){
				if (base.checkCaret) { base.lastCaret = base.$preview.caret(); }
			});
			//.bind('mousemove.keyboard', function(){
			//	if (!o.alwaysOpen && $.keyboard.currentKeyboard === base.el && !base.opening) { base.$preview.focus(); }
			//});
			// prevent keyboard event bubbling
			base.$keyboard.bind('mousedown.keyboard click.keyboard touchstart.keyboard', function(e){
				e.stopPropagation();
			});

		// If preventing paste, block context menu (right click)
		if (o.preventPaste){
			base.$preview.bind('contextmenu.keyboard', function(e){ e.preventDefault(); });
			base.$el.bind('contextmenu.keyboard', function(e){ e.preventDefault(); });
		}

		if (o.appendLocally) {
			base.$el.after( base.$keyboard );
		} else {
			base.$keyboard.appendTo('body');
		}

		base.$allKeys
			.bind(o.keyBinding.split(' ').join('.keyboard ') + '.keyboard repeater.keyboard', function(e){
				// prevent errors when external triggers attempt to "type" - see issue #158
				if (!base.$keyboard.is(":visible")){ return false; }
				// 'key', { action: doAction, original: n, curTxt : n, curNum: 0 }
				var txt, key = $.data(this, 'key'), action = key.action.split(':')[0];
				base.$preview.focus();
				base.$lastKey = $(this);
				base.lastKey = key.curTxt;
				// Start caret in IE when not focused (happens with each virtual keyboard button click
				if (base.checkCaret) { base.$preview.caret( base.lastCaret.start, base.lastCaret.end ); }
				if (action.match('meta')) { action = 'meta'; }
				if ($.keyboard.keyaction.hasOwnProperty(action) && $(this).hasClass('ui-keyboard-actionkey')) {
					// stop processing if action returns false (close & cancel)
					if ($.keyboard.keyaction[action](base,this,e) === false) { return false; }
				} else if (typeof key.action !== 'undefined') {
					txt = base.lastKey = (base.wheel && !$(this).hasClass('ui-keyboard-actionkey')) ? key.curTxt : key.action;
					base.insertText(txt);
					if (!base.capsLock && !o.stickyShift && !e.shiftKey) {
						base.shiftActive = false;
						base.showKeySet(this);
					}
				}
				base.checkCombos();
				base.checkMaxLength();
				if ($.isFunction(o.change)){ o.change( $.Event("change"), base, base.el ); }
				base.$el.trigger( 'change.keyboard', [ base, base.el ] );
				base.$preview.focus();
				// attempt to fix issue #131
				if (base.checkCaret) { base.$preview.caret( base.lastCaret.start, base.lastCaret.end ); }
				e.preventDefault();
			})
			// Change hover class and tooltip
			.bind('mouseenter.keyboard mouseleave.keyboard', function(e){
				if (!base.isCurrent()) { return; }
				var el = this, $this = $(this),
					// 'key' = { action: doAction, original: n, curTxt : n, curNum: 0 }
					key = $.data(el, 'key');
				if (e.type === 'mouseenter' && base.el.type !== 'password' && !$this.hasClass(o.css.buttonDisabled) ){
					$this
						.addClass(o.css.buttonHover)
						.attr('title', function(i,t){
							// show mouse wheel message
							return (base.wheel && t === '' && base.sets) ? o.wheelMessage : t;
						});
				}
				if (e.type === 'mouseleave'){
					key.curTxt = key.original;
					key.curNum = 0;
					$.data(el, 'key', key);
					$this
						.removeClass( (base.el.type === 'password') ? '' : o.css.buttonHover) // needed or IE flickers really bad
						.attr('title', function(i,t){ return (t === o.wheelMessage) ? '' : t; })
						.find('span').text( key.original ); // restore original button text
				}
			})
			// Allow mousewheel to scroll through other key sets of the same key
			.bind('mousewheel.keyboard', function(e, delta){
				if (base.wheel) {
					var txt, $this = $(this), key = $.data(this, 'key');
					txt = key.layers || base.getLayers( $this );
					key.curNum += (delta > 0) ? -1 : 1;
					if (key.curNum > txt.length-1) { key.curNum = 0; }
					if (key.curNum < 0) { key.curNum = txt.length-1; }
					key.layers = txt;
					key.curTxt = txt[key.curNum];
					$.data(this, 'key', key);
					$this.find('span').text( txt[key.curNum] );
					return false;
				}
			})
			// using "kb" namespace for mouse repeat functionality to keep it separate
			// I need to trigger a "repeater.keyboard" to make it work
			.bind('mouseup.keyboard mouseleave.kb touchend.kb touchmove.kb touchcancel.kb', function(e){
				if (e.type === 'mouseleave') {
					$(this).removeClass(o.css.buttonHover); // needed for touch devices
				} else {
					if (base.isVisible() && base.isCurrent()) { base.$preview.focus(); }
					if (base.checkCaret) { base.$preview.caret( base.lastCaret.start, base.lastCaret.end ); }
				}
				base.mouseRepeat = [false,''];
				clearTimeout(base.repeater); // make sure key repeat stops!
				return false;
			})
			// prevent form submits when keyboard is bound locally - issue #64
			.bind('click.keyboard', function(){
				return false;
			})
			// no mouse repeat for action keys (shift, ctrl, alt, meta, etc)
			.filter(':not(.ui-keyboard-actionkey)')
			// mouse repeated action key exceptions
			.add('.ui-keyboard-tab, .ui-keyboard-bksp, .ui-keyboard-space, .ui-keyboard-enter', base.$keyboard)
			.bind('mousedown.kb touchstart.kb', function(){
				if (o.repeatRate !== 0) {
					var key = $(this);
					base.mouseRepeat = [true, key]; // save the key, make sure we are repeating the right one (fast typers)
					setTimeout(function() {
						if (base.mouseRepeat[0] && base.mouseRepeat[1] === key) { base.repeatKey(key); }
					}, o.repeatDelay);
				}
				return false;
			});

		// adjust with window resize
		$(window).resize(function(){
			if (base.isVisible()) {
				base.$keyboard.position(base.position);
			}
		});

	};

	base.isVisible = function() {
		if (typeof(base.$keyboard) === 'undefined') {
			return false;
		}
		return base.$keyboard.is(":visible");
	};

	// Insert text at caret/selection - thanks to Derek Wickwire for fixing this up!
	base.insertText = function(txt){
		var bksp, t, h,
			// use base.$preview.val() instead of base.preview.value (val.length includes carriage returns in IE).
			val = base.$preview.val(),
			pos = base.$preview.caret(),
			scrL = base.$preview.scrollLeft(),
			scrT = base.$preview.scrollTop(),
			len = val.length; // save original content length

		// silly IE caret hacks... it should work correctly, but navigating using arrow keys in a textarea is still difficult
		if (pos.end < pos.start) { pos.end = pos.start; } // in IE, pos.end can be zero after input loses focus
		if (pos.start > len) { pos.end = pos.start = len; }

		if (base.preview.tagName === 'TEXTAREA') {
			// This makes sure the caret moves to the next line after clicking on enter (manual typing works fine)
			if (base.msie && val.substr(pos.start, 1) === '\n') { pos.start += 1; pos.end += 1; }
			// Set scroll top so current text is in view - needed for virtual keyboard typing, not manual typing
			// this doesn't appear to work correctly in Opera
			h = (val.split('\n').length - 1);
			base.preview.scrollTop = (h>0) ? base.lineHeight * h : scrT;
		}

		bksp = (txt === 'bksp' && pos.start === pos.end) ? true : false;
		txt = (txt === 'bksp') ? '' : txt;
		t = pos.start + (bksp ? -1 : txt.length);
		scrL += parseInt(base.$preview.css('fontSize'),10) * (txt === 'bksp' ? -1 : 1);

		base.$preview
			.val( base.$preview.val().substr(0, pos.start - (bksp ? 1 : 0)) + txt + base.$preview.val().substr(pos.end) )
			.caret(t, t)
			.scrollLeft(scrL);

		if (base.checkCaret) { base.lastCaret = { start: t, end: t }; } // save caret in case of bksp

	};

	// check max length
	base.checkMaxLength = function(){
		var t, p = base.$preview.val();
		if (o.maxLength !== false && p.length > o.maxLength) {
			t = Math.min(base.$preview.caret().start, o.maxLength); 
			base.$preview.val( p.substring(0, o.maxLength) );
			// restore caret on change, otherwise it ends up at the end.
			base.$preview.caret( t, t );
			base.lastCaret = { start: t, end: t };
		}
		if (base.$decBtn.length) {
			base.checkDecimal();
		}
	};

	// mousedown repeater
	base.repeatKey = function(key){
		key.trigger('repeater.keyboard');
		if (base.mouseRepeat[0]) {
			base.repeater = setTimeout(function() {
				base.repeatKey(key);
			}, base.repeatTime);
		}
	};

	base.showKeySet = function(el){
		var key = '',
		toShow = (base.shiftActive ? 1 : 0) + (base.altActive ? 2 : 0);
		if (!base.shiftActive) { base.capsLock = false; }
		// check meta key set
		if (base.metaActive) {
			// the name attribute contains the meta set # "meta99"
			key = (el && el.name && /meta/.test(el.name)) ? el.name : '';
			// save active meta keyset name
			if (key === '') {
				key = (base.metaActive === true) ? '' : base.metaActive;
			} else {
				base.metaActive = key;
			}
			// if meta keyset doesn't have a shift or alt keyset, then show just the meta key set
			if ( (!o.stickyShift && base.lastKeyset[2] !== base.metaActive) ||
				( (base.shiftActive || base.altActive) && !base.$keyboard.find('.ui-keyboard-keyset-' + key + base.rows[toShow]).length) ) {
				base.shiftActive = base.altActive = false;
			}
		} else if (!o.stickyShift && base.lastKeyset[2] !== base.metaActive && base.shiftActive) {
			// switching from meta key set back to default, reset shift & alt if using stickyShift
			base.shiftActive = base.altActive = false;
		}
		toShow = (base.shiftActive ? 1 : 0) + (base.altActive ? 2 : 0);
		key = (toShow === 0 && !base.metaActive) ? '-default' : (key === '') ? '' : '-' + key;
		if (!base.$keyboard.find('.ui-keyboard-keyset' + key + base.rows[toShow]).length) {
			// keyset doesn't exist, so restore last keyset settings
			base.shiftActive = base.lastKeyset[0];
			base.altActive = base.lastKeyset[1];
			base.metaActive = base.lastKeyset[2];
			return;
		}
		base.$keyboard
			.find('.ui-keyboard-alt, .ui-keyboard-shift, .ui-keyboard-actionkey[class*=meta]').removeClass(o.css.buttonAction).end()
			.find('.ui-keyboard-alt')[(base.altActive) ? 'addClass' : 'removeClass'](o.css.buttonAction).end()
			.find('.ui-keyboard-shift')[(base.shiftActive) ? 'addClass' : 'removeClass'](o.css.buttonAction).end()
			.find('.ui-keyboard-lock')[(base.capsLock) ? 'addClass' : 'removeClass'](o.css.buttonAction).end()
			.find('.ui-keyboard-keyset').hide().end()
			.find('.ui-keyboard-keyset' + key + base.rows[toShow]).show().end()
			.find('.ui-keyboard-actionkey.ui-keyboard' + key).addClass(o.css.buttonAction);
		base.lastKeyset = [ base.shiftActive, base.altActive, base.metaActive ];
	};

	// check for key combos (dead keys)
	base.checkCombos = function(){
		if (!base.isVisible()) { return; }
		var i, r, t, t2,
			// use base.$preview.val() instead of base.preview.value (val.length includes carriage returns in IE).
			val = base.$preview.val(),
			pos = base.$preview.caret(),
			len = val.length; // save original content length

		// silly IE caret hacks... it should work correctly, but navigating using arrow keys in a textarea is still difficult
		if (pos.end < pos.start) { pos.end = pos.start; } // in IE, pos.end can be zero after input loses focus
		if (pos.start > len) { pos.end = pos.start = len; }
		// This makes sure the caret moves to the next line after clicking on enter (manual typing works fine)
		if (base.msie && val.substr(pos.start, 1) === '\n') { pos.start += 1; pos.end += 1; }

		if (o.useCombos) {
			// keep 'a' and 'o' in the regex for ae and oe ligature (æ,œ)
			// thanks to KennyTM: http://stackoverflow.com/questions/4275077/replace-characters-to-make-international-letters-diacritics
			// original regex /([`\'~\^\"ao])([a-z])/mig moved to $.keyboard.comboRegex
			if (base.msie) {
				// old IE may not have the caret positioned correctly, so just check the whole thing
				val = val.replace(base.regex, function(s, accent, letter){
					return (o.combos.hasOwnProperty(accent)) ? o.combos[accent][letter] || s : s;
				});
			// prevent combo replace error, in case the keyboard closes - see issue #116
			} else if (base.$preview.length) {
				// Modern browsers - check for combos from last two characters left of the caret
				t = pos.start - (pos.start - 2 >= 0 ? 2 : 0);
				// target last two characters
				base.$preview.caret(t, pos.end);
				// do combo replace
				t2 = (base.$preview.caret().text || '').replace(base.regex, function(s, accent, letter){
					return (o.combos.hasOwnProperty(accent)) ? o.combos[accent][letter] || s : s;
				});
				// add combo back
				base.$preview.val( base.$preview.caret().replace(t2) );
				val = base.$preview.val();
			}
		}

		// check input restrictions - in case content was pasted
		if (o.restrictInput && val !== '') {
			t = val;
			r = base.acceptedKeys.length;
			for (i=0; i < r; i++){
				if (t === '') { continue; }
				t2 = base.acceptedKeys[i];
				if (val.indexOf(t2) >= 0) {
					// escape out all special characters
					if (/[\[|\]|\\|\^|\$|\.|\||\?|\*|\+|\(|\)|\{|\}]/g.test(t2)) { t2 = '\\' + t2; }
					t = t.replace( (new RegExp(t2, "g")), '');
				}
			}
			// what's left over are keys that aren't in the acceptedKeys array
			if (t !== '') { val = val.replace(t, ''); }
		}

		// save changes, then reposition caret
		pos.start += val.length - len;
		pos.end += val.length - len;
		base.$preview.val(val);

		base.$preview.caret(pos.start, pos.end);

		// calculate current cursor scroll location and set scrolltop to keep it in view
		base.preview.scrollTop = base.lineHeight * (val.substring(0, pos.start).split('\n').length - 1); // find row, multiply by font-size

		base.lastCaret = { start: pos.start, end: pos.end };

		if (o.acceptValid) { base.checkValid(); }

		return val; // return text, used for keyboard closing section
	};

	// Toggle accept button classes, if validating
	base.checkValid = function(){
		var valid = true;
		if (o.validate && typeof o.validate === "function") {
			valid = o.validate(base, base.$preview.val(), false);
		}
		// toggle accept button classes; defined in the css
		base.$keyboard.find('.ui-keyboard-accept')
			[valid ? 'removeClass' : 'addClass']('ui-keyboard-invalid-input')
			[valid ? 'addClass' : 'removeClass']('ui-keyboard-valid-input');
	};

	// Decimal button for num pad - only allow one (not used by default)
	base.checkDecimal = function(){
		// Check US "." or European "," format
		if ( ( base.decimal && /\./g.test(base.preview.value) ) || ( !base.decimal && /\,/g.test(base.preview.value) ) ) {
			base.$decBtn
				.attr({ 'disabled': 'disabled', 'aria-disabled': 'true' })
				.removeClass(o.css.buttonDefault + ' ' + o.css.buttonHover)
				.addClass(o.css.buttonDisabled);
		} else {
			base.$decBtn
				.removeAttr('disabled')
				.attr({ 'aria-disabled': 'false' })
				.addClass(o.css.buttonDefault)
				.removeClass(o.css.buttonDisabled);
		}
	};

	// get other layer values for a specific key
	base.getLayers = function(el){
		var key, keys;
		key = el.attr('data-pos');
		keys = el.closest('.ui-keyboard').find('button[data-pos="' + key + '"]').map(function(){
			// added '> span' because jQuery mobile adds multiple spans inside the button
			return $(this).find('> span').text();
		}).get();
		return keys;
	};

	base.isCurrent = function(set){
		var cur = $.keyboard.currentKeyboard || false;
		if (set) {
			cur = $.keyboard.currentKeyboard = base.el;
		} else if (set === false && cur === base.el) {
			cur = $.keyboard.currentKeyboard = '';
		}
		return cur === base.el;
	};

	// Go to next or prev inputs
	// goToNext = true, then go to next input; if false go to prev
	// isAccepted is from autoAccept option or true if user presses shift-enter
	base.switchInput = function(goToNext, isAccepted){
		if (typeof o.switchInput === "function") {
			o.switchInput(base, goToNext, isAccepted);
		} else {
			base.$keyboard.hide();
			var kb, stopped = false,
				all = $('button, input, textarea, a').filter(':visible'),
				indx = all.index(base.$el) + (goToNext ? 1 : -1);
				base.$keyboard.show();
			if (indx > all.length - 1) {
				stopped = o.stopAtEnd;
				indx = 0; // go to first input
			}
			if (indx < 0) {
				stopped = o.stopAtEnd;
				indx = all.length - 1; // stop or go to last
			}
			if (!stopped) {
				base.close(isAccepted);
				kb = all.eq(indx).data('keyboard');
				if (kb && kb.options.openOn.length) {
					kb.focusOn();
				} else {
					all.eq(indx).focus();
				}
			}
		}
		return false;
	};

	// Close the keyboard, if visible. Pass a status of true, if the content was accepted (for the event trigger).
	base.close = function(accepted){
		if (base.isVisible()) {
			clearTimeout(base.throttled);
			var val = (accepted) ?  base.checkCombos() : base.originalContent;
			// validate input if accepted
			if (accepted && o.validate && typeof(o.validate) === "function" && !o.validate(base, val, true)) {
				val = base.originalContent;
				accepted = false;
				if (o.cancelClose) { return; }
			}
			base.isCurrent(false);
			base.$el
				.removeClass('ui-keyboard-input-current ui-keyboard-autoaccepted')
				// add "ui-keyboard-autoaccepted" to inputs
				.addClass( (accepted || false) ? accepted === true ? '' : 'ui-keyboard-autoaccepted' : '' )
				.trigger( (o.alwaysOpen) ? '' : 'beforeClose.keyboard', [ base, base.el, (accepted || false) ] )
				.val( val )
				.scrollTop( base.el.scrollHeight )
				.trigger( ((accepted || false) ? 'accepted.keyboard' : 'canceled.keyboard'), [ base, base.el ] )
				.trigger( (o.alwaysOpen) ? 'inactive.keyboard' : 'hidden.keyboard', [ base, base.el ] )
				.blur();
			if (o.openOn) {
				// rebind input focus - delayed to fix IE issue #72
				base.timer = setTimeout(function(){
					base.$el.bind( o.openOn + '.keyboard', function(){ base.focusOn(); });
					// remove focus from element (needed for IE since blur doesn't seem to work)
					if ($(':focus')[0] === base.el) { base.$el.blur(); }
				}, 500);
			}
			if (!o.alwaysOpen) {
				base.$keyboard.hide();
			}
			if (!base.watermark && base.el.value === '' && base.inPlaceholder !== '') {
				base.$el
					.addClass('ui-keyboard-placeholder')
					.val(base.inPlaceholder);
			}
			// trigger default change event - see issue #146
			base.$el.trigger('change');
		}
		return !!accepted;
	};

	base.accept = function(){
		return base.close(true);
	};

	base.escClose = function(e){
		if ( e.type === 'keyup' ) {
			return ( e.which === 27 )  ? base.close() : '';
		}
		var cur = base.isCurrent();
		// keep keyboard open if alwaysOpen or stayOpen is true - fixes mutliple always open keyboards or single stay open keyboard
		if ( !base.isVisible() || (o.alwaysOpen && !cur) || (!o.alwaysOpen && o.stayOpen && cur && !base.isVisible()) ) { return; }
		// ignore autoaccept if using escape - good idea?

		if ( e.target !== base.el && cur ) {
			// stop propogation in IE - an input getting focus doesn't open a keyboard if one is already open
			if ( base.allie ) {
				e.preventDefault();
			}
			base.close( o.autoAccept ? 'true' : false );
		}
	};

	// Build default button
	base.keyBtn = $('<button />')
		.attr({ 'role': 'button', 'aria-disabled': 'false', 'tabindex' : '-1' })
		.addClass('ui-keyboard-button');

	// Add key function
	// keyName = the name of the function called in $.keyboard.keyaction when the button is clicked
	// name = name added to key, or cross-referenced in the display options
	// newSet = keyset to attach the new button
	// regKey = true when it is not an action key
	base.addKey = function(keyName, name, regKey){
		var t, keyType, m, map, nm,
			n = (regKey === true) ? keyName : o.display[name] || keyName,
			kn = (regKey === true) ? keyName.charCodeAt(0) : keyName;
		// map defined keys - format "key(A):Label_for_key"
		// "key" = key that is seen (can any character; but it might need to be escaped using "\" or entered as unicode "\u####"
		// "(A)" = the actual key on the real keyboard to remap, ":Label_for_key" ends up in the title/tooltip
		if (/\(.+\)/.test(n)) { // n = "\u0391(A):alpha"
			map = n.replace(/\(([^()]+)\)/, ''); // remove "(A)", left with "\u0391:alpha"
			m = n.match(/\(([^()]+)\)/)[1]; // extract "A" from "(A)"
			n = map;
			nm = map.split(':');
			map = (nm[0] !== '' && nm.length > 1) ? nm[0] : map; // get "\u0391" from "\u0391:alpha"
			base.mappedKeys[m] = map;
		}

		// find key label
		nm = n.split(':');
		if (nm[0] === '' && nm[1] === '') { n = ':'; } // corner case of ":(:):;" reduced to "::;", split as ["", "", ";"]
		n = (nm[0] !== '' && nm.length > 1) ? $.trim(nm[0]) : n;
		t = (nm.length > 1) ? $.trim(nm[1]).replace(/_/g, " ") || '' : ''; // added to title

		// Action keys will have the 'ui-keyboard-actionkey' class
		// '\u2190'.length = 1 because the unicode is converted, so if more than one character, add the wide class
		keyType = (n.length > 1) ? ' ui-keyboard-widekey' : '';
		keyType += (regKey) ? '' : ' ui-keyboard-actionkey';
		return base.keyBtn
			.clone()
			.attr({ 'data-value' : n, 'name': kn, 'data-pos': base.temp[1] + ',' + base.temp[2], 'title' : t })
			.data('key', { action: keyName, original: n, curTxt : n, curNum: 0 })
			// add "ui-keyboard-" + keyName, if this is an action key (e.g. "Bksp" will have 'ui-keyboard-bskp' class)
			// add "ui-keyboard-" + unicode of 1st character (e.g. "~" is a regular key, class = 'ui-keyboard-126' (126 is the unicode value - same as typing &#126;)
			.addClass('ui-keyboard-' + kn + keyType + ' ' + o.css.buttonDefault)
			.html('<span>' + n + '</span>')
			.appendTo(base.temp[0]);
	};

	base.buildKeyboard = function(){
		var action, row, newSet, isAction,
			currentSet, key, keys, margin,
			sets = 0,

		container = $('<div />')
			.addClass('ui-keyboard ' + o.css.container + (o.alwaysOpen ? ' ui-keyboard-always-open' : '') )
			.attr({ 'role': 'textbox' })
			.hide();

		// build preview display
		if (o.usePreview) {
			base.$preview = base.$el.clone(false)
				.removeAttr('id')
				.removeClass('ui-keyboard-placeholder ui-keyboard-input')
				.addClass('ui-keyboard-preview ' + o.css.input)
				.attr('tabindex', '-1')
				.show(); // for hidden inputs
			// build preview container and append preview display
			$('<div />')
				.addClass('ui-keyboard-preview-wrapper')
				.append(base.$preview)
				.appendTo(container);
		} else {
			// No preview display, use element and reposition the keyboard under it.
			base.$preview = base.$el;
			o.position.at = o.position.at2;
		}
		if (o.lockInput) {
			base.$preview.addClass('ui-keyboard-lockedinput').attr({ 'readonly': 'readonly'});
		}

		// verify layout or setup custom keyboard
		if (o.layout === 'custom' || !$.keyboard.layouts.hasOwnProperty(o.layout)) {
			o.layout = 'custom';
			$.keyboard.layouts.custom = o.customLayout || { 'default' : ['{cancel}'] };
		}

		// Main keyboard building loop
		$.each($.keyboard.layouts[o.layout], function(set, keySet){
			if (set !== "") {
				sets++;
				newSet = $('<div />')
					.attr('name', set) // added for typing extension
					.addClass('ui-keyboard-keyset ui-keyboard-keyset-' + set)
					.appendTo(container)[(set === 'default') ? 'show' : 'hide']();

				for ( row = 0; row < keySet.length; row++ ){

					// remove extra spaces before spliting (regex probably could be improved)
					currentSet = $.trim(keySet[row]).replace(/\{(\.?)[\s+]?:[\s+]?(\.?)\}/g,'{$1:$2}');
					keys = currentSet.split(/\s+/);

					for ( key = 0; key < keys.length; key++ ) {
						// used by addKey function
						base.temp = [ newSet, row, key ];
						isAction = false;

						// ignore empty keys
						if (keys[key].length === 0) { continue; }

						// process here if it's an action key
						if( /^\{\S+\}$/.test(keys[key])){
							action = keys[key].match(/^\{(\S+)\}$/)[1].toLowerCase();
							// add active class if there are double exclamation points in the name
							if (/\!\!/.test(action)) {
								action = action.replace('!!','');
								isAction = true;
							}

							// add empty space
							if (/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/.test(action)) {
								// not perfect globalization, but allows you to use {sp:1,1em}, {sp:1.2em} or {sp:15px}
								margin = parseFloat( action.replace(/,/,'.').match(/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/)[1] || 0 );
								$('<span>&nbsp;</span>')
									// previously {sp:1} would add 1em margin to each side of a 0 width span
									// now Firefox doesn't seem to render 0px dimensions, so now we set the 
									// 1em margin x 2 for the width
									.width( (action.match('px') ? margin + 'px' : (margin * 2) + 'em') )
									.addClass('ui-keyboard-button ui-keyboard-spacer')
									.appendTo(newSet);
							}

							// meta keys
							if (/^meta\d+\:?(\w+)?/.test(action)){
								base.addKey(action, action);
								continue;
							}

							// switch needed for action keys with multiple names/shortcuts or
							// default will catch all others
							switch(action){

								case 'a':
								case 'accept':
									base
										.addKey('accept', action)
										.addClass(o.css.buttonAction);
									break;

								case 'alt':
								case 'altgr':
									base.addKey('alt', 'alt');
									break;

								case 'b':
								case 'bksp':
									base.addKey('bksp', action);
									break;

								case 'c':
								case 'cancel':
									base
										.addKey('cancel', action)
										.addClass(o.css.buttonAction);
									break;

								// toggle combo/diacritic key
								case 'combo':
									base
										.addKey('combo', 'combo')
										.addClass(o.css.buttonAction);
									break;

								// Decimal - unique decimal point (num pad layout)
								case 'dec':
									base.acceptedKeys.push((base.decimal) ? '.' : ',');
									base.addKey('dec', 'dec');
									break;

								case 'e':
								case 'enter':
									base
										.addKey('enter', action)
										.addClass(o.css.buttonAction);
									break;

								case 'empty':
									base
										.addKey('', ' ')
										.addClass(o.css.buttonDisabled)
										.attr('aria-disabled', true);
									break;

								case 's':
								case 'shift':
									base.addKey('shift', action);
									break;

								// Change sign (for num pad layout)
								case 'sign':
									base.acceptedKeys.push('-');
									base.addKey('sign', 'sign');
									break;

								case 'space':
									base.acceptedKeys.push(' ');
									base.addKey('space', 'space');
									break;

								case 't':
								case 'tab':
									base.addKey('tab', action);
									break;

								default:
									if ($.keyboard.keyaction.hasOwnProperty(action)){
										// base.acceptedKeys.push(action);
										base.addKey(action, action)[isAction ? 'addClass' : 'removeClass'](o.css.buttonAction);
									}

							}

						} else {

							// regular button (not an action key)
							base.acceptedKeys.push(keys[key].split(':')[0]);
							base.addKey(keys[key], keys[key], true);
						}
					}
					newSet.find('.ui-keyboard-button:last').after('<br class="ui-keyboard-button-endrow">');
				}
			}
		});
	
		if (sets > 1) { base.sets = true; }
		base.hasMappedKeys = !( $.isEmptyObject(base.mappedKeys) ); // $.isEmptyObject() requires jQuery 1.4+
		return container;
	};

	base.destroy = function() {
		$(document).unbind('mousedown.keyboard keyup.keyboard touchstart.keyboard');
		if (base.$keyboard) { base.$keyboard.remove(); }
		var unb = $.trim(o.openOn + ' accepted beforeClose canceled change contextmenu hidden initialized keydown keypress keyup visible').split(' ').join('.keyboard ');
		base.$el
			.removeClass('ui-keyboard-input ui-keyboard-lockedinput ui-keyboard-placeholder ui-keyboard-notallowed ui-keyboard-always-open ' + o.css.input)
			.removeAttr('aria-haspopup')
			.removeAttr('role')
			.unbind( unb + '.keyboard')
			.removeData('keyboard');
	};

		// Run initializer
		base.init();
	};

	// Action key function list
	$.keyboard.keyaction = {
		accept : function(base){
			base.close(true); // same as base.accept();
			return false;     // return false prevents further processing
		},
		alt : function(base,el){
			base.altActive = !base.altActive;
			base.showKeySet(el);
		},
		bksp : function(base){
			base.insertText('bksp'); // the script looks for the "bksp" string and initiates a backspace
		},
		cancel : function(base){
			base.close();
			return false; // return false prevents further processing
		},
		clear : function(base){
			base.$preview.val('');
		},
		combo : function(base){
			var c = !base.options.useCombos;
			base.options.useCombos = c;
			base.$keyboard.find('.ui-keyboard-combo')[(c) ? 'addClass' : 'removeClass'](base.options.css.buttonAction);
			if (c) { base.checkCombos(); }
			return false;
		},
		dec : function(base){
			base.insertText((base.decimal) ? '.' : ',');
		},
		"default" : function(base,el){
			base.shiftActive = base.altActive = base.metaActive = false;
			base.showKeySet(el);
		},
		// el is the pressed key (button) object; it is null when the real keyboard enter is pressed
		enter : function(base, el, e) {
			var tag = base.el.tagName, o = base.options;
			// shift-enter in textareas
			if (e.shiftKey) {
				// textarea & input - enterMod + shift + enter = accept, then go to prev; base.switchInput(goToNext, autoAccept)
				// textarea & input - shift + enter = accept (no navigation)
				return (o.enterNavigation) ? base.switchInput(!e[o.enterMod], true) : base.close(true);
			}
			// input only - enterMod + enter to navigate
			if (o.enterNavigation && (tag !== 'TEXTAREA' || e[o.enterMod])) {
				return base.switchInput(!e[o.enterMod], o.autoAccept ? 'true' : false);
			}
			// pressing virtual enter button inside of a textarea - add a carriage return
			// e.target is span when clicking on text and button at other times
			if (tag === 'TEXTAREA' && $(e.target).closest('button').length) {
				base.insertText(' \n'); // IE8 fix (space + \n) - fixes #71 thanks Blookie!
			}
		},
		// caps lock key
		lock : function(base,el){
			base.lastKeyset[0] = base.shiftActive = base.capsLock = !base.capsLock;
			base.showKeySet(el);
		},
		meta : function(base,el){
			base.metaActive = ($(el).hasClass(base.options.css.buttonAction)) ? false : true;
			base.showKeySet(el);
		},
		next : function(base) {
			base.switchInput(true, base.options.autoAccept);
			return false;
		},
		prev : function(base) {
			base.switchInput(false, base.options.autoAccept);
			return false;
		},
		shift : function(base,el){
			base.lastKeyset[0] = base.shiftActive = !base.shiftActive;
			base.showKeySet(el);
		},
		sign : function(base){
			if(/^\-?\d*\.?\d*$/.test( base.$preview.val() )) {
				base.$preview.val( (base.$preview.val() * -1) );
			}
		},
		space : function(base){
			base.insertText(' ');
		},
		tab : function(base) {
			var tag = base.el.tagName,
				o = base.options;
			if (tag === 'INPUT') {
				if (o.tabNavigation) {
					return base.switchInput(!base.shiftActive, true);
				} else {
					// ignore tab key in input
					return false;
				}
			}
			base.insertText('\t');
		}
	};

	// Default keyboard layouts
	$.keyboard.layouts = {
		'alpha' : {
			'default': [
				'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
				'{tab} a b c d e f g h i j [ ] \\',
				'k l m n o p q r s ; \' {enter}',
				'{shift} t u v w x y z , . / {shift}',
				'{accept} {space} {cancel}'
			],
			'shift': [
				'~ ! @ # $ % ^ & * ( ) _ + {bksp}',
				'{tab} A B C D E F G H I J { } |',
				'K L M N O P Q R S : " {enter}',
				'{shift} T U V W X Y Z < > ? {shift}',
				'{accept} {space} {cancel}'
			]
		},
		'qwerty' : {
			'default': [
				'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
				'{tab} q w e r t y u i o p [ ] \\',
				'a s d f g h j k l ; \' {enter}',
				'{shift} z x c v b n m , . / {shift}',
				'{accept} {space} {cancel}'
			],
			'shift': [
				'~ ! @ # $ % ^ & * ( ) _ + {bksp}',
				'{tab} Q W E R T Y U I O P { } |',
				'A S D F G H J K L : " {enter}',
				'{shift} Z X C V B N M < > ? {shift}',
				'{accept} {space} {cancel}'
			]
		},
		'international' : {
			'default': [
				'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
				'{tab} q w e r t y u i o p [ ] \\',
				'a s d f g h j k l ; \' {enter}',
				'{shift} z x c v b n m , . / {shift}',
				'{accept} {alt} {space} {alt} {cancel}'
			],
			'shift': [
				'~ ! @ # $ % ^ & * ( ) _ + {bksp}',
				'{tab} Q W E R T Y U I O P { } |',
				'A S D F G H J K L : " {enter}',
				'{shift} Z X C V B N M < > ? {shift}',
				'{accept} {alt} {space} {alt} {cancel}'
			],
			'alt': [
				'~ \u00a1 \u00b2 \u00b3 \u00a4 \u20ac \u00bc \u00bd \u00be \u2018 \u2019 \u00a5 \u00d7 {bksp}',
				'{tab} \u00e4 \u00e5 \u00e9 \u00ae \u00fe \u00fc \u00fa \u00ed \u00f3 \u00f6 \u00ab \u00bb \u00ac',
				'\u00e1 \u00df \u00f0 f g h j k \u00f8 \u00b6 \u00b4 {enter}',
				'{shift} \u00e6 x \u00a9 v b \u00f1 \u00b5 \u00e7 > \u00bf {shift}',
				'{accept} {alt} {space} {alt} {cancel}'
			],
			'alt-shift': [
				'~ \u00b9 \u00b2 \u00b3 \u00a3 \u20ac \u00bc \u00bd \u00be \u2018 \u2019 \u00a5 \u00f7 {bksp}',
				'{tab} \u00c4 \u00c5 \u00c9 \u00ae \u00de \u00dc \u00da \u00cd \u00d3 \u00d6 \u00ab \u00bb \u00a6',
				'\u00c4 \u00a7 \u00d0 F G H J K \u00d8 \u00b0 \u00a8 {enter}',
				'{shift} \u00c6 X \u00a2 V B \u00d1 \u00b5 \u00c7 . \u00bf {shift}',
				'{accept} {alt} {space} {alt} {cancel}'
			]
		},
		'dvorak' : {
			'default': [
				'` 1 2 3 4 5 6 7 8 9 0 [ ] {bksp}',
				'{tab} \' , . p y f g c r l / = \\',
				'a o e u i d h t n s - {enter}',
				'{shift} ; q j k x b m w v z {shift}',
				'{accept} {space} {cancel}'
			],
			'shift' : [
				'~ ! @ # $ % ^ & * ( ) { } {bksp}',
				'{tab} " < > P Y F G C R L ? + |', 
				'A O E U I D H T N S _ {enter}',
				'{shift} : Q J K X B M W V Z {shift}',
				'{accept} {space} {cancel}'
			]
		},
		'num' : {
			'default' : [
				'= ( ) {b}',
				'{clear} / * -',
				'7 8 9 +',
				'4 5 6 {sign}',
				'1 2 3 %',
				'0 . {a} {c}'
			]
		}
	};

	$.keyboard.defaultOptions = {

		// *** choose layout & positioning ***
		layout       : 'qwerty',
		customLayout : null,

		position     : {
			of : null, // optional - null (attach to input/textarea) or a jQuery object (attach elsewhere)
			my : 'center top',
			at : 'center top',
			at2: 'center bottom' // used when "usePreview" is false (centers the keyboard at the bottom of the input/textarea)
		},

		// preview added above keyboard if true, original input/textarea used if false
		usePreview   : true,

		// if true, the keyboard will always be visible
		alwaysOpen   : false,

		// give the preview initial focus when the keyboard becomes visible
		initialFocus : true,

		// if true, keyboard will remain open even if the input loses focus, but closes on escape or when another keyboard opens.
		stayOpen     : false,

		// *** change keyboard language & look ***
		display : {
			'a'      : '\u2714:Accept (Shift-Enter)', // check mark - same action as accept
			'accept' : 'Accept:Accept (Shift-Enter)',
			'alt'    : 'Alt:\u2325 AltGr',        // other alternatives \u2311 
			'b'      : '\u232b:Backspace',    // Left arrow (same as &larr;)
			'bksp'   : 'Bksp:Backspace',
			'c'      : '\u2716:Cancel (Esc)', // big X, close - same action as cancel
			'cancel' : 'Cancel:Cancel (Esc)',
			'clear'  : 'C:Clear',             // clear num pad
			'combo'  : '\u00f6:Toggle Combo Keys',
			'dec'    : '.:Decimal',           // decimal point for num pad (optional), change '.' to ',' for European format
			'e'      : '\u23ce:Enter',        // down, then left arrow - enter symbol
			'empty'  : '\u00a0',
			'enter'  : 'Enter:Enter \u23ce',
			'lock'   : 'Lock:\u21ea Caps Lock', // caps lock
			'next'   : 'Next \u21e8',
			'prev'   : '\u21e6 Prev',
			's'      : '\u21e7:Shift',        // thick hollow up arrow
			'shift'  : 'Shift:Shift',
			'sign'   : '\u00b1:Change Sign',  // +/- sign for num pad
			'space'  : '&nbsp;:Space',
			't'      : '\u21e5:Tab',          // right arrow to bar (used since this virtual keyboard works with one directional tabs)
			'tab'    : '\u21e5 Tab:Tab'       // \u21b9 is the true tab symbol (left & right arrows)
		},

		// Message added to the key title while hovering, if the mousewheel plugin exists
		wheelMessage : 'Use mousewheel to see other keys',

		css : {
			input          : 'ui-widget-content ui-corner-all', // input & preview
			container      : 'ui-widget-content ui-widget ui-corner-all ui-helper-clearfix', // keyboard container
			buttonDefault  : 'ui-state-default ui-corner-all', // default state
			buttonHover    : 'ui-state-hover',  // hovered button
			buttonAction   : 'ui-state-active', // Action keys (e.g. Accept, Cancel, Tab, etc); this replaces "actionClass" option
			buttonDisabled : 'ui-state-disabled' // used when disabling the decimal button {dec} when a decimal exists in the input area
		},

		// *** Useability ***
		// Auto-accept content when clicking outside the keyboard (popup will close)
		autoAccept   : false,

		// Prevents direct input in the preview window when true
		lockInput    : false,

		// Prevent keys not in the displayed keyboard from being typed in
		restrictInput: false,

		// Check input against validate function, if valid the accept button gets a class name of "ui-keyboard-valid-input"
		// if invalid, the accept button gets a class name of "ui-keyboard-invalid-input"
		acceptValid  : false,

		// if acceptValid is true & the validate function returns a false, this option will cancel a keyboard
		// close only after the accept button is pressed
		cancelClose  : true,

		// tab to go to next, shift-tab for previous (default behavior)
		tabNavigation: false,

		// enter for next input; shift-enter accepts content & goes to next
		// shift + "enterMod" + enter ("enterMod" is the alt as set below) will accept content and go to previous in a textarea
		enterNavigation : false,
		// mod key options: 'ctrlKey', 'shiftKey', 'altKey', 'metaKey' (MAC only)
		enterMod : 'altKey', // alt-enter to go to previous; shift-alt-enter to accept & go to previous

		// if true, the next button will stop on the last keyboard input/textarea; prev button stops at first
		// if false, the next button will wrap to target the first input/textarea; prev will go to the last
		stopAtEnd : true,

		// Set this to append the keyboard immediately after the input/textarea it is attached to. This option
		// works best when the input container doesn't have a set width and when the "tabNavigation" option is true
		appendLocally: false,

		// If false, the shift key will remain active until the next key is (mouse) clicked on; if true it will stay active until pressed again
		stickyShift  : true,

		// Prevent pasting content into the area
		preventPaste : false,

		// caret places at the end of any text
		caretToEnd   : false,

		// Set the max number of characters allowed in the input, setting it to false disables this option
		maxLength    : false,

		// Mouse repeat delay - when clicking/touching a virtual keyboard key, after this delay the key will start repeating
		repeatDelay  : 500,

		// Mouse repeat rate - after the repeatDelay, this is the rate (characters per second) at which the key is repeated
		// Added to simulate holding down a real keyboard key and having it repeat. I haven't calculated the upper limit of
		// this rate, but it is limited to how fast the javascript can process the keys. And for me, in Firefox, it's around 20.
		repeatRate   : 20,

		// resets the keyboard to the default keyset when visible
		resetDefault : false,

		// Event (namespaced) on the input to reveal the keyboard. To disable it, just set it to ''.
		openOn       : 'focus',

		// Event (namepaced) for when the character is added to the input (clicking on the keyboard)
		keyBinding   : 'mousedown touchstart',

		// combos (emulate dead keys : http://en.wikipedia.org/wiki/Keyboard_layout#US-International)
		// if user inputs `a the script converts it to à, ^o becomes ô, etc.
		useCombos : true,
		combos    : {
			'`' : { a:"\u00e0", A:"\u00c0", e:"\u00e8", E:"\u00c8", i:"\u00ec", I:"\u00cc", o:"\u00f2", O:"\u00d2", u:"\u00f9", U:"\u00d9", y:"\u1ef3", Y:"\u1ef2" }, // grave
			"'" : { a:"\u00e1", A:"\u00c1", e:"\u00e9", E:"\u00c9", i:"\u00ed", I:"\u00cd", o:"\u00f3", O:"\u00d3", u:"\u00fa", U:"\u00da", y:"\u00fd", Y:"\u00dd" }, // acute & cedilla
			'"' : { a:"\u00e4", A:"\u00c4", e:"\u00eb", E:"\u00cb", i:"\u00ef", I:"\u00cf", o:"\u00f6", O:"\u00d6", u:"\u00fc", U:"\u00dc", y:"\u00ff", Y:"\u0178" }, // umlaut/trema
			'^' : { a:"\u00e2", A:"\u00c2", e:"\u00ea", E:"\u00ca", i:"\u00ee", I:"\u00ce", o:"\u00f4", O:"\u00d4", u:"\u00fb", U:"\u00db", y:"\u0177", Y:"\u0176" }, // circumflex
			'~' : { a:"\u00e3", A:"\u00c3", e:"\u1ebd", E:"\u1ebc", i:"\u0129", I:"\u0128", o:"\u00f5", O:"\u00d5", u:"\u0169", U:"\u0168", y:"\u1ef9", Y:"\u1ef8", n:"\u00f1", N:"\u00d1" } // tilde
		},

/*
		// *** Methods ***
		// commenting these out to reduce the size of the minified version
		// Callbacks - attach a function to any of these callbacks as desired
		initialized : function(e, keyboard, el) {},
		visible     : function(e, keyboard, el) {},
		change      : function(e, keyboard, el) {},
		beforeClose : function(e, keyboard, el, accepted) {},
		accepted    : function(e, keyboard, el) {},
		canceled    : function(e, keyboard, el) {},
		hidden      : function(e, keyboard, el) {},
		switchInput : null, // called instead of base.switchInput
*/

		// this callback is called just before the "beforeClose" to check the value
		// if the value is valid, return true and the keyboard will continue as it should (close if not always open, etc)
		// if the value is not value, return false and the clear the keyboard value ( like this "keyboard.$preview.val('');" ), if desired
		// The validate function is called after each input, the "isClosing" value will be false; when the accept button is clicked, "isClosing" is true
		validate    : function(keyboard, value, isClosing) { return true; }

	};

	// for checking combos
	$.keyboard.comboRegex = /([`\'~\^\"ao])([a-z])/mig;

	// store current keyboard element; used by base.isCurrent()
	$.keyboard.currentKeyboard = '';

	$.fn.keyboard = function(options){
		return this.each(function(){
			if (!$(this).data('keyboard')) {
				(new $.keyboard(this, options));
			}
		});
	};

	$.fn.getkeyboard = function(){
		return this.data("keyboard");
	};

})(jQuery);

/* Copyright (c) 2010 C. F., Wong (<a href="http://cloudgen.w0ng.hk">Cloudgen Examplet Store</a>)
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 * Highly modified from the original
 */
(function($, len, createRange, duplicate){
"use strict";
$.fn.caret = function(options,opt2) {
	if ( typeof this[0] === 'undefined' || this.is(':hidden') || this.css('visibility') === 'hidden' ) { return this; }
	var n, s, start, e, end, selRange, range, stored_range, te, val,
		selection = document.selection, t = this[0], sTop = t.scrollTop,
		ss = typeof t.selectionStart !== 'undefined';
	if (typeof options === 'number' && typeof opt2 === 'number') {
		start = options;
		end = opt2;
	}
	if (typeof start !== 'undefined') {
		if (ss){
			t.selectionStart=start;
			t.selectionEnd=end;
		} else {
			selRange = t.createTextRange();
			selRange.collapse(true);
			selRange.moveStart('character', start);
			selRange.moveEnd('character', end-start);
			selRange.select();
		}
		// must be visible or IE8 crashes; IE9 in compatibility mode works fine - issue #56
		if (this.is(':visible') || this.css('visibility') !== 'hidden') { this.focus(); }
		t.scrollTop = sTop;
		return this;
	} else {
		if (ss) {
			s = t.selectionStart;
			e = t.selectionEnd;
		} else {
			if (t.tagName === 'TEXTAREA') {
				val = this.val();
				range = selection[createRange]();
				stored_range = range[duplicate]();
				stored_range.moveToElementText(t);
				stored_range.setEndPoint('EndToEnd', range);
				// thanks to the awesome comments in the rangy plugin
				s = stored_range.text.replace(/\r/g, '\n')[len];
				e = s + range.text.replace(/\r/g, '\n')[len];
			} else {
				val = this.val().replace(/\r/g, '\n');
				range = selection[createRange]()[duplicate]();
				range.moveEnd('character', val[len]);
				s = (range.text === '' ? val[len] : val.lastIndexOf(range.text));
				range = selection[createRange]()[duplicate]();
				range.moveStart('character', -val[len]);
				e = range.text[len];
			}
		}
		te = (t.value || '').substring(s,e);
		return { start : s, end : e, text : te, replace : function(st){
			return t.value.substring(0,s) + st + t.value.substring(e, t.value[len]);
		}};
	}
};
})(jQuery, 'length', 'createRange', 'duplicate');
/*
 * jQuery UI Virtual Keyboard Typing Simulator v1.3 for Keyboard v1.8.14+ only
 *
 * By Rob Garrison (aka Mottie & Fudgey)
 * Licensed under the MIT License
 *
 * Use this extension with the Virtual Keyboard to simulate
 * typing for tutorials or whatever else use you can find
 *
 * Requires:
 *  jQuery
 *  Keyboard plugin : https://github.com/Mottie/Keyboard
 *
 * Setup:
 *  $('.ui-keyboard-input')
 *   .keyboard(options)
 *   .addTyping(typing-options);
 *
 *  // or if targeting a specific keyboard
 *  $('#keyboard1')
 *   .keyboard(options)
 *   .addTyping(typing-options);
 *
 * Basic Usage:
 *  // To disable manual typing on the virtual keyboard, just set "showTyping" option to false
 *  $('#keyboard-input').keyboard(options).addTyping({ showTyping: false });
 *
 *  // Change the default typing delay (time the virtual keyboard highlights the manually typed key) - default = 250 milliseconds
 *  $('#keyboard-input').keyboard(options).addTyping({ delay: 500 });
 *
 *  // get keyboard object, open it, then start typing simulation
 *  $('#keyboard-input').getkeyboard().reveal().typeIn('Hello World', 700);
 *
 *  // get keyboard object, open it, type in "This is a test" with 700ms delay between types, then accept & close the keyboard
 *  $('#keyboard-input').getkeyboard().reveal().typeIn('This is a test', 700, function(){ $('#keyboard-input').getkeyboard().close(true); });
 */

// EXAMPLES:
// $('#inter').getkeyboard().reveal().typeIn('\tHello \b\n\tWorld', 500);
// $('#meta').getkeyboard().reveal().typeIn('abCDd11123\u2648\u2649\u264A\u264B', 700, function(){ alert('all done!'); });

(function($){
	$.fn.addTyping = function(options){
		//Set the default values, use comma to separate the settings, example:
		var defaults = {
			showTyping : true,
			delay      : 250
		};
		return this.each(function(){
			// make sure a keyboard is attached
			var base = $(this).data('keyboard');
			if (!base) { return; }

			// variables
			base.typing_options = $.extend({}, defaults, options);
			base.typing_keymap = {
				' '  : 'space',
				'"'  : '34',
				"'"  : '39',
				'&nbsp;' : 'space',
				'\b' : 'bksp',
				'\n' : 'Enter',
				'\r' : 'Enter',
				'\t' : 'tab'
			};
			base.typing_xref = {
				8  : 'bksp',
				9  : 'tab',
				13 : 'enter',
				32 : 'space'
			};
			base.typing_event = base.typing_flag = false;
			// no manual typing simulation if lockInput is true; but the typeIn() function still works
//			if (base.options.lockInput) { base.typing_options.showTyping = false; }

			base.typing_setup = function(){
				if (base.typing_flag) { return; }
				base.typing_flag = true;
				var el = (base.$preview) ? base.$preview : base.$el;

				el
				.bind('keyup.keyboard', function(e){
					if (e.which >= 37 && e.which <=40) { return; } // ignore arrow keys
					if (e.which === 16) { base.shiftActive = false; }
					if (e.which === 18) { base.altActive = false; }
					if (e.which === 16 || e.which === 18) {
						base.showKeySet();
						setTimeout(function(){ base.$preview.focus(); }, 200); // Alt key will shift focus to the menu - doesn't work in Windows
						return;
					}
				})
				// change keyset when either shift or alt is held down
				.bind('keydown.keyboard', function(e){
					e.temp = false; // prevent repetitive calls while keydown repeats.
					if (e.which === 16) { e.temp = (base.shiftActive) ? false : true; base.shiftActive = true; }
					// it should be ok to reset e.temp, since both alt and shift will call this function separately
					if (e.which === 18) { e.temp = (base.altActive) ? false : true; base.altActive = true; }
					if (e.temp) {
						base.showKeySet();
						base.$preview.focus(); // Alt shift focus to the menu
					}
					base.typing_event = true;
					// Simulate key press for tab and backspace since they don't fire the keypress event
					if (e.which === 8 || e.which === 9) {
						base.typeIn( '', base.typing_options.delay || 250, function(){
							base.typing_event = false;
						}, e); // pass event object
					}

				})
				.bind('keypress.keyboard', function(e){
					// Simulate key press on virtual keyboard
					if (base.typing_event && !base.options.lockInput) {
						base.typeIn( '', base.typing_options.delay || 250, function(){
							base.typing_event = false;
						}, e); // pass event object
					}
				});
			}

			// Store typing text
			base.typeIn = function(txt, delay, callback, e){
				if (!base.isVisible) {
					// keyboard was closed
					base.typing_options.init = false;
					clearTimeout(base.typing_timer);
					return;
				}
				var o = base.typing_options, tar, m, n, k, key, ks, meta, set;
				if (base.typing_options.init !== true) {
					o.init = true;
					o.text = txt;
					o.len = txt.length;
					o.delay = delay || 300;
					o.current = 0; // position in text string
					o.callback = callback;
				}

				// function that loops through and types each character
				txt = o.text.substring( o.current, ++o.current );
				ks = base.$keyboard.find('.ui-keyboard-keyset');
				k = (base.typing_keymap.hasOwnProperty(txt)) ? base.typing_keymap[txt] : txt;

				// typing_event is true when typing on the actual keyboard - look for actual key
				// All of this breaks when the CapLock is on... unable to find a cross-browser method that works.
				tar = '.ui-keyboard-button[data-value="' + k + '"]';
				if (base.typing_event && e) {
					if (base.typing_xref.hasOwnProperty(e.keyCode || e.which)) {
						// special named keys: bksp, tab and enter
						tar = '.ui-keyboard-' + base.typing_xref[e.keyCode || e.which];
					} else {
						m = String.fromCharCode(e.charCode || e.which);
						tar = (base.mappedKeys.hasOwnProperty(m)) ? '.ui-keyboard-button[data-value="' + base.mappedKeys[m]  + '"]' : '.ui-keyboard-' + (e.charCode || e.which);
					}
				}
				// find key
				key = ks.filter(':visible').find(tar);
				if (key.length) {
					// key is visible, simulate typing
					base.typing_simulateKey(key,txt);
				} else {
					// key not found, check if it is in the keymap (tab, space, enter, etc)
					if (base.typing_event) {
						key = ks.find(tar);
					} else {
						// key not found, check if it is in the keymap (tab, space, enter, etc)
						n = (base.typing_keymap.hasOwnProperty(txt)) ? base.typing_keymap[txt] : txt.charCodeAt(0);
						if (n === 'bksp') { txt = n; }
						// find actual key on keyboard
						key = ks.find('.ui-keyboard-' + n);
					}

					// find the keyset
					set = key.closest('.ui-keyboard-keyset');

					// figure out which keyset the key is in then simulate clicking on that meta key, then on the key
					if (set.attr('name')) {
						// get meta key name
						meta = set.attr('name');
						// show correct key set
						base.shiftActive = /shift/.test(meta);
						base.altActive = /alt/.test(meta);
						base.metaActive = base.lastKeyset[2] = (meta).match(/meta\d+/) || false;
						// make the plugin think we're passing it a jQuery object with a name

						base.showKeySet({ name : base.metaActive});

						// Add the key
						base.typing_simulateKey(key,txt);
					} else {
						if (!base.typing_event) {
							// Key doesn't exist on the keyboard, so just enter it
							base.insertText(txt);
							base.checkCombos();
						}
					}

				}

				if (o.current < o.len){
					if (!base.isVisible) { return; } // keyboard was closed, abort!!
					setTimeout(function(){ base.typeIn(); }, o.delay);
				} else {
					o.init = false;
					if ($.isFunction(o.callback)) {
						// ensure all typing animation is done before the callback
						setTimeout(function(){
							o.callback(base);
						}, o.delay);
					}
					return;
				}
			};

			// mouseover the key, add the text directly, then mouseout on the key
			base.typing_simulateKey = function(el,txt){
				var e = el.length;
				if (e) { el.filter(':visible').trigger('mouseenter.keyboard'); }
				base.typing_timer = setTimeout(function(){
					if (e) { setTimeout(function(){ el.trigger('mouseleave.keyboard'); }, base.typing_options.delay/3); }
					if (!base.isVisible) { return; }
					if (!base.typing_event) {
						base.insertText(txt);
						base.checkCombos();
					}
				}, base.typing_options.delay/3);
			};

			if (base.typing_options.showTyping) {
				// visible event is fired before this extension is initialized, so check!
				if (base.options.alwaysOpen && base.isVisible) {
					base.typing_setup();
				}
				// capture and simulate typing
				base.$el.bind('visible.keyboard', function(e){
					base.typing_setup();
				});
			}

		});
	};
})(jQuery);
// tipsy, facebook style tooltips for jquery
// version 1.0.0a
// (c) 2008-2010 jason frame [jason@onehackoranother.com]
// releated under the MIT license

(function($) {
    
    function fixTitle($ele) {
        if ($ele.attr('title') || typeof($ele.attr('original-title')) != 'string') {
            $ele.attr('original-title', $ele.attr('title') || '').removeAttr('title');
        }
    }
    
    function Tipsy(element, options) {
        this.$element = $(element);
        this.options = options;
        this.enabled = true;
        fixTitle(this.$element);
    }
    
    Tipsy.prototype = {
        show: function() {
            var title = this.getTitle();
            if (title && this.enabled) {
                var $tip = this.tip();
                
                $tip.find('.tipsy-inner')[this.options.html ? 'html' : 'text'](title);
                $tip[0].className = 'tipsy'; // reset classname in case of dynamic gravity
                $tip.remove().css({top: 0, left: 0, visibility: 'hidden', display: 'block'}).appendTo(document.body);
                
                var pos = $.extend({}, this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                });
                
                var actualWidth = $tip[0].offsetWidth, actualHeight = $tip[0].offsetHeight;
                var gravity = (typeof this.options.gravity == 'function')
                                ? this.options.gravity.call(this.$element[0])
                                : this.options.gravity;
                
                var tp;
                switch (gravity.charAt(0)) {
                    case 'n':
                        tp = {top: pos.top + pos.height + this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 's':
                        tp = {top: pos.top - actualHeight - this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 'e':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth - this.options.offset};
                        break;
                    case 'w':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width + this.options.offset};
                        break;
                }
                
                if (gravity.length == 2) {
                    if (gravity.charAt(1) == 'w') {
                        tp.left = pos.left + pos.width / 2 - 15;
                    } else {
                        tp.left = pos.left + pos.width / 2 - actualWidth + 15;
                    }
                }
                
                $tip.css(tp).addClass('tipsy-' + gravity);
                
                if (this.options.fade) {
                    $tip.stop().css({opacity: 0, display: 'block', visibility: 'visible'}).animate({opacity: this.options.opacity});
                } else {
                    $tip.css({visibility: 'visible', opacity: this.options.opacity});
                }
            }
        },
        
        hide: function() {
            if (this.options.fade) {
                this.tip().stop().fadeOut(function() { $(this).remove(); });
            } else {
                this.tip().remove();
            }
        },
        
        getTitle: function() {
            var title, $e = this.$element, o = this.options;
            fixTitle($e);
            var title, o = this.options;
            if (typeof o.title == 'string') {
                title = $e.attr(o.title == 'title' ? 'original-title' : o.title);
            } else if (typeof o.title == 'function') {
                title = o.title.call($e[0]);
            }
            title = ('' + title).replace(/(^\s*|\s*$)/, "");
            return title || o.fallback;
        },
        
        tip: function() {
            if (!this.$tip) {
                this.$tip = $('<div class="tipsy"></div>').html('<div class="tipsy-arrow"></div><div class="tipsy-inner"/></div>');
            }
            return this.$tip;
        },
        
        validate: function() {
            if (!this.$element[0].parentNode) {
                this.hide();
                this.$element = null;
                this.options = null;
            }
        },
        
        enable: function() { this.enabled = true; },
        disable: function() { this.enabled = false; },
        toggleEnabled: function() { this.enabled = !this.enabled; }
    };
    
    $.fn.tipsy = function(options) {
        
        if (options === true) {
            return this.data('tipsy');
        } else if (typeof options == 'string') {
            return this.data('tipsy')[options]();
        }
        
        options = $.extend({}, $.fn.tipsy.defaults, options);
        
        function get(ele) {
            var tipsy = $.data(ele, 'tipsy');
            if (!tipsy) {
                tipsy = new Tipsy(ele, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, 'tipsy', tipsy);
            }
            return tipsy;
        }
        
        function enter() {
            var tipsy = get(this);
            tipsy.hoverState = 'in';
            if (options.delayIn == 0) {
                tipsy.show();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'in') tipsy.show(); }, options.delayIn);
            }
        };
        
        function leave() {
            var tipsy = get(this);
            tipsy.hoverState = 'out';
            if (options.delayOut == 0) {
                tipsy.hide();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'out') tipsy.hide(); }, options.delayOut);
            }
        };
        
        if (!options.live) this.each(function() { get(this); });
        
        if (options.trigger != 'manual') {
            var binder   = options.live ? 'live' : 'bind',
                eventIn  = options.trigger == 'hover' ? 'mouseenter' : 'focus',
                eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur';
            this[binder](eventIn, enter)[binder](eventOut, leave);
        }
        
        return this;
        
    };
    
    $.fn.tipsy.defaults = {
        delayIn: 0,
        delayOut: 0,
        fade: false,
        fallback: '',
        gravity: 'n',
        html: false,
        live: false,
        offset: 0,
        opacity: 0.8,
        title: 'title',
        trigger: 'hover'
    };
    
    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };
    
    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };
    
    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };
    
})(jQuery);
// Generated code, do not edit
window.examples=[
  ["rho-iota","⍝  ⍳ n  generates a list of numbers from 0 to n-1\n⍝  n n ⍴ A  arranges the elements of A in an n×n matrix\n5 5 ⍴ ⍳ 25"],
  ["mult","⍝ Multiplication table\n⍝  a × b    scalar multiplication, \"a times b\"\n⍝  ∘.       is the \"outer product\" operator\n⍝  A ∘.× B  every item in A times every item in B\n(⍳ 10) ∘.× ⍳ 10"],
  ["sierpinski","⍝ Sierpinski's triangle\n\n⍝ It's a recursively defined figure.\n⍝ We will use the following definition:\n⍝\n⍝   * the Sierpinski triangle of rank 0 is a one-by-one matrix 'X'\n⍝\n⍝   * if S is the triangle of rank n, then rank n+1 would be\n⍝     the two-dimensional catenation:\n⍝             S 0\n⍝             S S\n⍝     where \"0\" is an all-blank matrix same size as S.\n\nf ← {(⍵,(⍴⍵)⍴0)⍪⍵,⍵}\nS ← {' #'[(f⍣⍵) 1 1 ⍴ 1]}\nS 5"],
  ["primes","\n(1=+⌿0=A∘.∣A)/A←2↓⍳100"],
  ["life","⍝ Conway's game of life\n\n⍝ This example was inspired by the impressive demo at\n⍝ http://www.youtube.com/watch?v=a9xAKttWgP4\n\n⍝ Create a matrix:\n⍝     0 1 1\n⍝     1 1 0\n⍝     0 1 0\ncreature ← (3 3 ⍴ ⍳ 9) ∊ 1 2 3 4 7   ⍝ Original creature from demo\ncreature ← (3 3 ⍴ ⍳ 9) ∊ 1 3 6 7 8   ⍝ Glider\n\n⍝ Place the creature on a larger board, near the centre\nboard ← ¯1 ⊖ ¯2 ⌽ 5 7 ↑ creature\n\n⍝ A function to move from one generation to the next\nlife ← {⊃1 ⍵ ∨.∧ 3 4 = +/ +⌿ 1 0 ¯1 ∘.⊖ 1 0 ¯1 ⌽¨ ⊂⍵}\n\n⍝ Compute n-th generation and format it as a\n⍝ character matrix\ngen ← {' #'[(life ⍣ ⍵) board]}\n\n⍝ Show first three generations\n(gen 1) (gen 2) (gen 3)"],
  ["rule30","⍝ See https://en.wikipedia.org/wiki/Rule_30\n\nrule←30\nn←50 ⍝ number of rows to compute\nt←⌽rule⊤⍨8⍴2\n' #'[⊃⌽{⍵,⍨⊂t[2⊥¨3,/0,0,⍨↑⍵]}⍣n⊂z,1,z←n⍴0]"],
  ["queens","queens←{                            ⍝ The N-queens problem.\n\n    search←{                        ⍝ Search for all solutions.\n        (⊂⍬)∊⍵:0⍴⊂⍬                 ⍝ stitched: abandon this branch.\n        0=⍴⍵:rmdups ⍺               ⍝ all done: solution!\n        (hd tl)←(↑⍵)(1↓⍵)           ⍝ head 'n tail of remaining ranks.\n        next←⍺∘,¨hd                 ⍝ possible next steps.\n        rems←hd free¨⊂tl            ⍝ unchecked squares.\n        ⊃,/next ∇¨rems              ⍝ ... in following ranks.\n    }\n\n    cvex←(1+⍳⍵)×⊂¯1 0 1             ⍝ Checking vectors.\n\n    free←{⍵~¨⍺+(⍴⍵)↑cvex}           ⍝ Unchecked squares.\n\n    rmdups←{                        ⍝ Ignore duplicate solution.\n        rots←{{⍒⍵}\\4/⊂⍵}            ⍝ 4 rotations.\n        refs←{{⍋⍵}\\2/⊂⍵}            ⍝ 2 reflections.\n        best←{(↑⍋⊃⍵)⊃⍵}             ⍝ best (=lowest) solution.\n        all8←,⊃refs¨rots ⍵          ⍝ all 8 orientations.\n        (⍵≡best all8)⊃⍬(,⊂⍵)        ⍝ ignore if not best.\n    }\n\n    fmt←{                           ⍝ Format solution.\n        chars←'·⍟'[(⊃⍵)∘.=⍳⍺]       ⍝ char array of placed queens.\n        expd←1↓,⊃⍺⍴⊂0 1             ⍝ expansion mask.\n        ⊃¨↓↓expd\\chars              ⍝ vector of char matrices.\n    }\n\n    squares←(⊂⍳⌈⍵÷2),1↓⍵⍴⊂⍳⍵        ⍝ initial squares\n\n    ⍵ fmt ⍬ search squares          ⍝ all distinct solutions.\n}\nqueens 5"],
  ["mandelbrot","\n' #'[9>|⊃{⍺+⍵*2}/9⍴⊂¯3×.7j.5-⍉a∘.+0j1×a←(⍳n+1)÷n←98]"]
];
$(function($){
  // Bookmarkable source code
  var hashParams={}
  if(location.hash){
    var a=location.hash.substring(1).split(',')
    for(var i=0;i<a.length;i++){var b=a[i].split('=');hashParams[b[0]]=unescape(b[1])}
  }
  $('#code').text(hashParams.code||'').focus()
  $('#permalink').tipsy({gravity:'e',opacity:1,delayIn:1000}).bind('mouseover focus',function(){
    $(this).attr('href','#code='+escape($('#code').val()));return false
  })

  function execute(){ // "Execute" button
    try{
      var s=$('#code').val()
      if(s===')t'){
        $('#result').removeClass('error').text('Running tests...')
        setTimeout(runDocTests,1)
      }else{
        $('#result').removeClass('error').text(apl.format(apl(s)).join('\n')+'\n')
      }
    }catch(e){
      console&&console.error&&console.error(e.stack)
      $('#result').addClass('error').text(e)
    }
  }

  $('#go').tipsy({gravity:'e',opacity:1,delayIn:1000}).closest('form').submit(function(){execute();return false})

  if(hashParams.run)$('#go').click()

  var hSymbolDefs={
    '+':'Conjugate, Add',
    '-':'Negate, Subtract',
    '×':'Sign of, Multiply',
    '÷':'Reciprocal, Divide',
    '⌈':'Ceiling, Greater of',
    '⌊':'Floor, Lesser of',
    '∣':'Absolute value, Residue',
    '⍳':'Index generator, Index of',
    '?':'Roll, Deal',
    '*':'Exponential, To the power of',
    '⍟':'Natural logarithm, Logarithm to the base',
    '○':'Pi times, Circular and hyperbolic functions',
    '!':'Factorial, Binomial',
    '⌹':'Matrix inverse, Matrix divide',
    '⍠':'Variant operator',
    '<':'Less than',
    '≤':'Less than or equal',
    '=':'Equal',
    '≥':'Greater than or equal',
    '>':'Greater than',
    '≠':'Not equal',
    '≡':'Depth, Match',
    '≢':'Tally, Not match',
    '∊':'Enlist, Membership',
    '⍷':'Find',
    '∪':'Unique, Union',
    '∩':'Intersection',
    '~':'Not, Without',
    '∨':'Or (Greatest Common Divisor)',
    '∧':'And (Least Common Multiple)',
    '⍱':'Nor',
    '⍲':'Nand',
    '⍴':'Shape of, Reshape',
    ',':'Ravel, Catenate',
    '⍪':'First axis catenate',
    '⌽':'Reverse, Rotate',
    '⊖':'First axis rotate',
    '⍉':'Transpose',
    '↑':'First, Take',
    '↓':'Drop',
    '⊂':'Enclose, Partition',
    '⊃':'Mix, Pick',
    '⌷':'Index',
    '⍋':'Grade up',
    '⍒':'Grade down',
    '⊤':'Encode',
    '⊥':'Decode',
    '⍕':'Format, Format by specification',
    '⍎':'Execute',
    '⊣':'Stop, Left',
    '⊢':'Pass, Right',
    '⎕':'Evaluated input, Output with a newline',
    '⍞':'Character input, Bare output',
    '¨':'Each',
    '∘':'Compose',
    '/':'Reduce',
    '⌿':'1st axis reduce',
    '\\':'Scan',
    '⍀':'1st axis scan',
    '⍣':'Power operator',
    '⍨':'Commute',
    '¯':'Negative number sign',
    '∞':'Infinity',
    '⍝':'Comment',
    '←':'Assignment',
    '⍬':'Zilde',
    '⋄':'Statement separator',
    '⍺':'Left formal parameter',
    '⍵':'Right formal parameter',
    APL:'Press backquote (`) followed by another key to insert an APL symbol, e.g. `r inserts rho (⍴)'
  }

  // Keyboard
  var layout={
    'default':[
      '` 1 2 3 4 5 6 7 8 9 0 - =',
      'q w e r t y u i o p [ ] \\',
      'a s d f g h j k l ; \' {enter}',
      '{shift} z x c v b n m , . / {bksp}',
      '{alt} {space} {exec!!}'
    ],
    shift:[
      '~ ! @ # $ % ^ & * ( ) _ +',
      'Q W E R T Y U I O P { } |',
      'A S D F G H J K L : " {enter}',
      '{shift} Z X C V B N M < > ? {bksp}',
      '{alt} {space} {exec!!}'
    ],
    alt:[
      '{empty} ¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ ÷ ×',
      '{empty} ⍵ ∊ ⍴ ~ ↑ ↓ ⍳ ○ ⍟ ← → ⍀',
      '⍺ ⌈ ⌊ ⍫ ∇ ∆ ∘ {empty} ⎕ ⋄ {empty} {enter}',
      '{shift} ⊂ ⊃ ∩ ∪ ⊥ ⊤ ∣ ⍪ {empty} ⌿ {bksp}',
      '{alt} {space} {exec!!}'
    ],
    'alt-shift':[
      '⍨ ∞ ⍁ ⍂ ⍠ ≈ ⌸ ⍯ ⍣ ⍱ ⍲ ≢ ≡',
      '⌹ ⍹ ⍷ ⍤ {empty} ⌶ ⊖ ⍸ ⍬ ⌽ ⊣ ⊢ ⍉',
      '⍶ {empty} {empty} {empty} ⍒ ⍋ ⍝ {empty} ⍞ {empty} {empty} {enter}',
      '{shift} ⊆ ⊇ ⋔ ⍦ ⍎ ⍕ ⌷ « » ↗ {bksp}',
      '{alt} {space} {exec!!}'
    ]
  }

  // Key mappings
  var combos={'`':{}}
  var asciiKeys=layout['default'].concat(layout.shift).join(' ').split(' ')
  var aplKeys=layout.alt.concat(layout['alt-shift']).join(' ').split(' ')
  for(var i=0;i<asciiKeys.length;i++){
    var k=asciiKeys[i],v=aplKeys[i]
    if(!/^\{\w+\}$/.test(k)&&!/^\{\w+\}$/.test(v))combos['`'][k]=v
  }

  $.keyboard.keyaction.exec=execute
  $.keyboard.defaultOptions.combos={}
  $.keyboard.comboRegex=/(`)(.)/mig
  $('textarea').keyboard({
    layout:'custom',useCombos:false,autoAccept:true,usePreview:false,customLayout:layout,useCombos:true,combos:combos,
    display:{bksp:'Bksp',shift:'⇧',alt:'APL',enter:'Enter',exec:'⍎'}
  })

  $('textarea').addTyping().focus()

  $('#code').keydown(function(e){if(e.keyCode===13&&e.ctrlKey){$('#go').click();return false}})

  var tipsyOpts={gravity:'s',delayIn:1000,opacity:1,title:function(){return hSymbolDefs[$(this).text()]||''}}
  $('.ui-keyboard').on('mouseover', '.ui-keyboard-button', function(event) {
    var $b = $(event.target).closest('.ui-keyboard-button')
    if(!$b.data('tipsyInitialised'))$b.data('tipsyInitialised',1).tipsy(tipsyOpts).tipsy('show')
    return false
  })

  // Examples
  for(var i=0;i<window.examples.length;i++){
    $('#examples').append(' <a href="#example'+i+'>'+window.examples[i][0]+'</a>')
  }

  $('#examples').on('click','a',function(){
    var a=window.examples[+$(this).attr('href').replace(/#example(\d+)$/,'$1')]
    $('#code').val(a[1]).focus()
    return false
  })

  // Tests
  function runDocTests(){
    $('#result').removeClass('error').html('')
    var nExecuted=0,nFailed=0,t0=+new Date
    for(var i=0;i<aplTests.length;i++){
      var x=aplTests[i],code=x[0],mode=x[1],expectation=x[2]
      nExecuted++
      var outcome=runDocTest([code,mode,expectation],apl,apl.approx)
      if(!outcome.success){
        nFailed++
        var s='Test failed: '+JSON.stringify(code)+'\n'+
              '             '+JSON.stringify(expectation)+'\n'
        if(outcome.reason)s+=outcome.reason+'\n'
        if(outcome.error)s+=outcome.error.stack+'\n'
        $('#result').text($('#result').text()+s)
      }
    }
    $('#result').text($('#result').text()+(
      (nFailed?nFailed+' out of '+nExecuted+' tests failed':'All '+nExecuted+' tests passed')+
      ' in '+(new Date-t0)+' ms.\n'
    ))
  }
})
this.runDocTest=function(h,exec,approx){
  var code=h[0],mode=h[1],expectation=h[2]
  if(mode==='←→'){
    try{
      var y=exec(expectation)
    }catch(e){
      return{success:0,error:e,reason:'Cannot compute expected value '+JSON.stringify(expectation)}
    }
    try{
      var x=exec(code)
      if(!approx(x,y))return{success:0,reason:'Expected '+JSON.stringify(y)+' but got '+JSON.stringify(x)}
    }catch(e){
      return{success:0,error:e}
    }
  }else if(mode==='!!!'){
    try{
      exec(code)
      return{success:0,reason:"It should have thrown an error, but it didn't."}
    }catch(e){
      if(expectation&&e.name.slice(0,expectation.length)!==expectation)
        return{
          success:0,error:e,
          reason:'It should have failed with '+JSON.stringify(expectation)+', but it failed with '+JSON.stringify(e.message)
        }
    }
  }else{
    return{success:0,reason:'Unrecognised expectation: '+JSON.stringify(expectation)}
  }
  return{success:1}
}
var aplTests = [
["x ⋄ x←0","!!!","VALUE ERROR"],
["⌽¨⍣3⊢(1 2)3(4 5 6)","←→","(2 1)3(6 5 4)"],
["{}0","←→","⍬"],
["A←5","←→","5"],
["A×A←2 5","←→","4 25"],
["r←3 ⋄ get_c←{2×○r} ⋄ get_S←{○r*2}\n before←.01×⌊100×r c S\n r←r+1\n after←.01×⌊100×r c S\n before after","←→","(3 18.84 28.27)(4 25.13 50.26)"],
["{⍺}0","!!!","VALUE ERROR"],
["{x}0 ⋄ x←0","!!!","VALUE ERROR"],
["{⍫1⋄2}⍬","←→","1"],
["c←{} ⋄ x←{c←⍫⋄1}⍬ ⋄ {x=1:c 2⋄x}⍬","←→","2"],
["{1 + 1} 1","←→","2"],
["{⍵=0:1 ⋄ 2×∇⍵-1} 5","←→","32 # two to the power of"],
["{⍵<2 : 1 ⋄ (∇⍵-1)+(∇⍵-2) } 8","←→","34 # Fibonacci sequence"],
["⊂{⍺⍺ ⍺⍺ ⍵}'hello'","←→","⊂⊂'hello'"],
["⊂{⍺⍺ ⍵⍵ ⍵}⌽'hello'","←→","⊂'olleh'"],
["⊂{⍶⍶⍵}'hello'","←→","⊂⊂'hello'"],
["⊂{⍶⍹⍵}⌽'hello'","←→","⊂'olleh'"],
["+{⍵⍶⍵}10 20 30","←→","20 40 60"],
["f←{⍵⍶⍵} ⋄ +f 10 20 30","←→","20 40 60"],
["twice←{⍶⍶⍵} ⋄ *twice 2","←→","1618.1779919126539"],
["f←{-⍵;⍺×⍵} ⋄ (f 5)(3 f 5)","←→","¯5 15"],
["f←{;} ⋄ (f 5)(3 f 5)","←→","⍬⍬"],
["²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ *²2","←→","1618.1779919126539"],
["²←{⍶⍶⍵;⍺⍶⍺⍶⍵} ⋄ 3*²2","←→","19683"],
["H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ +H÷ 2","←→","2.5"],
["H←{⍵⍶⍹⍵;⍺⍶⍹⍵} ⋄ 7 +H÷ 2","←→","7.5"],
["⍴''","←→",",0"],
["⍴'x'","←→","⍬"],
["⍴'xx'","←→",",2"],
["⍴'a''b'","←→",",3"],
["⍴\"a\"\"b\"","←→",",3"],
["⍴'a\"\"b'","←→",",4"],
["⍴'''a'","←→",",2"],
["⍴'a'''","←→",",2"],
["''''","←→","\"'\""],
["⍴\"\\f\\t\\n\\r\\u1234\\xff\"","←→",",18"],
["∞","←→","¯"],
["¯∞","←→","¯¯"],
["¯∞j¯∞","←→","¯¯j¯¯"],
["∞∞","←→","¯ ¯"],
["∞¯","←→","¯ ¯"],
["123 + «456 + 789»","←→","1368"],
["⍴ x[⍋x←6?40]","←→",",6"],
["(a b) ← 1 2 ⋄ a","←→","1"],
["(a b) ← 1 2 ⋄ b","←→","2"],
["(a b c) ← 3 4 5 ⋄ a b c","←→","3 4 5"],
["(a b c) ← 6     ⋄ a b c","←→","6 6 6"],
["((a b)c)←3(4 5) ⋄ a b c","←→","3 3 (4 5)"],
["¯1 ¯2 ¯3 ¯4*2","←→","1 4 9 16"],
["0j1*2","←→","¯1"],
["1j2*3","←→","¯11j¯2"],
[".5j1.5*5","←→","9.875j¯0.375"],
["'hello'}","!!!","SYNTAX ERROR"],
["⍬","←→","0⍴0"],
["⍴⍬","←→",",0"],
["⍳0","←→","⍬"],
["⍴0","←→","⍬"],
["⍬","←→","⍬"],
["⍬⍬","←→","⍬ ⍬"],
["1⍬2⍬3","←→","1 ⍬ 2 ⍬ 3"],
["\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"~\"AEIOU\"","←→","'BCDFGHJKLMNPQRSTVWXYZ'"],
["1 2 3 4 5 6~2 4 6","←→","1 3 5"],
["\"THIS IS TEXT\"~\" \"","←→","'THISISTEXT'"],
["\"THIS\" \"AND\" \"THAT\"~\"T\"","←→","'THIS' 'AND' 'THAT'"],
["\"THIS\" \"AND\" \"THAT\"~\"AND\"","←→","'THIS' 'AND' 'THAT'"],
["\"THIS\" \"AND\" \"THAT\"~⊂\"AND\"","←→","'THIS' 'THAT'"],
["\"THIS\" \"AND\" \"THAT\"~\"TH\" \"AND\"","←→","'THIS' 'THAT'"],
["11 12 13 14 15 16~2 3⍴1 2 3 14 5 6","←→","11 12 13 15 16"],
["(2 2⍴⍳4)~2","!!!","RANK ERROR"],
["(-⍟)2 3","←→","-⍟2 3"],
["2(-*)3","←→","-2*3"],
["⊃3","←→","3"],
["⊃(1 2)(3 4)","←→","2 2⍴1 2 3 4"],
["⊃(1 2)(3 4 5)","←→","2 3⍴1 2 0 3 4 5"],
["⊃1 2","←→","1 2"],
["⊃(1 2)3","←→","2 2⍴1 2 3 0"],
["⊃1(2 3)","←→","2 2⍴1 0 2 3"],
["⊃2 2⍴1(1 1 2⍴3 4)(5 6)(2 0⍴0)","←→","2 2 1 2 2⍴1 0 0 0 3 4 0 0 5 6 0 0 0 0 0 0"],
["⊃⍬","←→","⍬"],
["⊃2 3 0⍴0","←→","2 3 0⍴0"],
["⍬⊃3","←→","3"],
["2⊃'PICK'","←→","'C'"],
["(⊂1 0)⊃2 2⍴'ABCD'","←→","'C'"],
["1⊃'foo' 'bar'","←→","'bar'"],
["1 2⊃'foo' 'bar'","←→","'r'"],
["(2 2⍴0)⊃1 2","!!!","RANK ERROR"],
["(⊂2 1⍴0)⊃2 2⍴0","!!!","RANK ERROR"],
["(⊂2 2⍴0)⊃1 2","!!!","RANK ERROR"],
["(⊂2 2)⊃1 2","!!!","RANK ERROR"],
["(⊂0 2)⊃2 2⍴'ABCD'","!!!","INDEX ERROR"],
["a←' this is a test ' ⋄ (a≠' ')⊂a","←→","'this' 'is' (,'a') 'test'"],
["↓1 2 3","←→","⊂1 2 3"],
["↓(1 2)(3 4)","←→","⊂(1 2)(3 4)"],
["↓2 2⍴⍳4","←→","(0 1)(2 3)"],
["↓2 3 4⍴⍳24","←→","2 3⍴(0 1 2 3)(4 5 6 7)(8 9 10 11)(12 13 14 15)(16 17 18 19)(20 21 22 23)"],
["4↓'OVERBOARD'","←→","'BOARD'"],
["¯5↓'OVERBOARD'","←→","'OVER'"],
["⍴10↓'OVERBOARD'","←→",",0"],
["0 ¯2↓3 3⍴'ONEFATFLY'","←→","3 1⍴'OFF'"],
["¯2 ¯1↓3 3⍴'ONEFATFLY'","←→","1 2⍴'ON'"],
["1↓3 3⍴'ONEFATFLY'","←→","2 3⍴'FATFLY'"],
["⍬↓3 3⍴⍳9","←→","3 3⍴⍳9"],
["1 1↓2 3 4⍴\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"","←→","1 2 4⍴'QRSTUVWX'"],
["¯1 ¯1↓2 3 4⍴\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"","←→","1 2 4⍴'ABCDEFGH'"],
["1↓0","←→","⍬"],
["0 1↓2","←→","1 0⍴0"],
["1 2↓3","←→","0 0⍴0"],
["⍬↓0","←→","0"],
["⍪2 3 4","←→","3 1⍴2 3 4"],
["⍪0","←→","1 1⍴0"],
["⍪2 2⍴2 3 4 5","←→","2 2⍴2 3 4 5"],
["⍴⍪2 3⍴⍳6","←→","2 3"],
["⍴⍪2 3 4⍴⍳24","←→","2 12"],
["(2 3⍴⍳6)⍪9","←→","3 3⍴(0 1 2 3 4 5 9 9 9)"],
["1⍪2","←→","1 2"],
["123⊢456","←→","456"],
["⊢456","←→","456"],
["123⊣456","←→","123"],
["⊣456","←→","456"],
["≢0","←→","1"],
["≢0 0 0","←→","3"],
["≢⍬","←→","0"],
["≢2 3⍴⍳6","←→","2"],
["3≢3","←→","0"],
[",2 3 4⍴'abcdefghijklmnopqrstuvwx'","←→","'abcdefghijklmnopqrstuvwx'"],
[",123","←→","1⍴123"],
["⌹2","←→",".5"],
["⌹2 2⍴4 3 3 2","←→","2 2⍴¯2 3 3 ¯4"],
["(4 4⍴12 1 4 10 ¯6 ¯5 4 7 ¯4 9 3 4 ¯2 ¯6 7 7)⌹93 81 93.5 120.5","←→",".0003898888816687221 ¯.005029566573526544 .04730651764247189 .0705568912859835"],
["⌹2 2 2⍴⍳8","!!!","RANK ERROR"],
["⌹2 3⍴⍳6","!!!","LENGTH ERROR"],
["17-⍨23","←→","6"],
["7⍴⍨2 3","←→","2 3⍴7"],
["+⍨2","←→","4"],
["-⍨123","←→","0"],
["+4","←→","4"],
["++4","←→","4"],
["+4 5","←→","4 5"],
["+((5 6)(7 1))","←→","(5 6)(7 1)"],
["+ (5 6)(7 1)","←→","(5 6)(7 1)"],
["+1j¯2","←→","1j2"],
["1+2","←→","3"],
["2 3+5 8","←→","7 11"],
["(2 3⍴1 2 3 4 5 6)+    ¯2","←→","2 3 ⍴ ¯1 0 1 2 3 4"],
["(2 3⍴1 2 3 4 5 6)+  2⍴¯2","!!!","RANK ERROR"],
["(2 3⍴1 2 3 4 5 6)+2 3⍴¯2","←→","2 3 ⍴ ¯1 0 1 2 3 4"],
["1 2 3+4 5","!!!","LENGTH ERROR"],
["(2 3⍴⍳6)+3 2⍴⍳6","!!!","LENGTH ERROR"],
["1j¯2+¯2j3","←→","¯1j1"],
["+/⍬","←→","0"],
["¯+¯¯","!!!","DOMAIN ERROR"],
["1j¯+2j¯¯","!!!","DOMAIN ERROR"],
["-4","←→","¯4"],
["-1 2 3","←→","¯1 ¯2 ¯3"],
["-1j2","←→","¯1j¯2"],
["1-3","←→","¯2"],
["5-¯3","←→","8"],
["5j2-3j8","←→","2j¯6"],
["5-3j8","←→","2j¯8"],
["-/⍬","←→","0"],
["×¯2 ¯1 0 1 2","←→","¯1 ¯1 0 1 1"],
["×¯","←→","1"],
["×¯¯","←→","¯1"],
["×3j¯4","←→",".6j¯.8"],
["7×8","←→","56"],
["1j¯2×¯2j3","←→","4j7"],
["2×1j¯2","←→","2j¯4"],
["×/⍬","←→","1"],
["÷2","←→",".5"],
["÷2j3","←→","0.15384615384615385J¯0.23076923076923078"],
["0÷0","!!!","DOMAIN ERROR"],
["27÷9","←→","3"],
["4j7÷1j¯2","←→","¯2j3"],
["0j2÷0j1","←→","2"],
["5÷2j1","←→","2j¯1"],
["÷/⍬","←→","1"],
["*2","←→","7.38905609893065"],
["*2j3","←→","¯7.315110094901103J1.0427436562359045"],
["2*3","←→","8"],
["3*2","←→","9"],
["¯2*3","←→","¯8"],
["¯3*2","←→","9"],
["¯1*.5","←→","0j1"],
["1j2*3j4","←→",".129009594074467j.03392409290517014"],
["*/⍬","←→","1"],
["⍟123","←→","4.812184355372417"],
["⍟0","←→","¯¯"],
["⍟¯1","←→","0j1×○1"],
["⍟123j456","←→","6.157609243895447J1.3073297857599793"],
["12⍟34","←→","1.419111870829036"],
["12⍟¯34","←→","1.419111870829036j1.26426988871305"],
["¯12⍟¯34","←→","1.1612974763994781j¯.2039235425372641"],
["1j2⍟3j4","←→","1.2393828252698689J¯0.5528462880299602"],
["∣¯8 0 8 ¯3.5","←→","8 0 8 3.5"],
["|5j12","←→","13"],
["3∣5","←→","2"],
["1j2|3j4","←→","¯1j1"],
["7 ¯7∘.|31 28 ¯30","←→","2 3⍴3 0 5 ¯4 0 ¯2"],
["¯0.2 0 0.2∘.|¯0.3 0 0.3","←→","3 3⍴¯0.1 0 ¯0.1 ¯0.3 0 0.3 0.1 0 0.1"],
["|/⍬","←→","0"],
["0|¯4","←→","¯4"],
["0|¯4j5","←→","¯4j5"],
["10|4j3","←→","4j3"],
["4j6|7j10","←→","3j4"],
["¯10 7j10 0.3|17 5 10","←→","¯3 ¯5j7 0.1"],
["+\\20 10 ¯5 7","←→","20 30 25 32"],
[",\\\"AB\" \"CD\" \"EF\"","←→","'AB' 'ABCD' 'ABCDEF'"],
["×\\2 3⍴5 2 3 4 7 6","←→","2 3⍴5 10 30 4 28 168"],
["∧\\1 1 1 0 1 1","←→","1 1 1 0 0 0"],
["-\\1 2 3 4","←→","1 ¯1 2 ¯2"],
["∨\\0 0 1 0 0 1 0","←→","0 0 1 1 1 1 1"],
["+\\1 2 3 4 5","←→","1 3 6 10 15"],
["+\\(1 2 3)(4 5 6)(7 8 9)","←→","(1 2 3)(5 7 9)(12 15 18)"],
["M←2 3⍴1 2 3 4 5 6 ⋄ +\\M","←→","2 3 ⍴ 1 3 6 4 9 15"],
["M←2 3⍴1 2 3 4 5 6 ⋄ +⍀M","←→","2 3 ⍴ 1 2 3 5 7 9"],
["M←2 3⍴1 2 3 4 5 6 ⋄ +\\[0]M","←→","2 3 ⍴ 1 2 3 5 7 9"],
[",\\'ABC'","←→","'A' 'AB' 'ABC'"],
["T←\"ONE(TWO) BOOK(S)\" ⋄ ≠\\T∊\"()\"","←→","0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0"],
["T←\"ONE(TWO) BOOK(S)\" ⋄ ((T∊\"()\")⍱≠\\T∊\"()\")/T","←→","'ONE BOOK'"],
["1 0 1\\'ab'","←→","'a b'"],
["0 1 0 1 0\\2 3","←→","0 2 0 3 0"],
["(2 2⍴0)\\'food'","!!!","RANK ERROR"],
["'abc'\\'def'","!!!","DOMAIN ERROR"],
["1 0 1 1\\'ab'","!!!","LENGTH ERROR"],
["1 0 1 1\\'abcd'","!!!","LENGTH ERROR"],
["1 0 1\\2 2⍴'ABCD'","←→","2 3⍴'A BC D'"],
["1 0 1⍀2 2⍴'ABCD'","←→","3 2⍴'AB  CD'"],
["1 0 1\\[0]2 2⍴'ABCD'","←→","3 2⍴'AB  CD'"],
["1 0 1\\[1]2 2⍴'ABCD'","←→","2 3⍴'A BC D'"],
["○2","←→","6.283185307179586"],
["○2J2","←→","6.283185307179586J6.283185307179586"],
["○'ABC'","!!!","DOMAIN ERROR"],
["¯12○2","←→","¯0.4161468365471J0.9092974268257"],
["¯12○2j3","←→","¯0.02071873100224J0.04527125315609"],
["¯11○2","←→","0j2"],
["¯11○2j3","←→","¯3j2"],
["¯10○2","←→","2"],
["¯10○2j3","←→","2j¯3"],
["¯9○2","←→","2"],
["¯9○2j3","←→","2j3"],
["¯8○2","←→","0J¯2.2360679774998"],
["¯8○2j3","←→","¯2.8852305489054J2.0795565201111"],
["¯7○0.5","←→","0.54930614433405"],
["¯7○2","←→","0.5493061443340548456976226185j¯1.570796326794896619231321692"],
["¯7○2j3","←→","0.1469466662255297520474327852j1.338972522294493561124193576"],
["¯6○0.5","←→","¯1.1102230246252E¯16J1.0471975511966"],
["¯6○2","←→","1.316957896924816708625046347"],
["¯6○2j3","←→","1.983387029916535432347076903j1.000143542473797218521037812"],
["¯5○2","←→","1.443635475178810342493276740"],
["¯5○2j3","←→","1.968637925793096291788665095j0.9646585044076027920454110595"],
["¯4○2","←→","1.7320508075689"],
["¯4○0","←→","0j1"],
["¯4○¯2","←→","¯1.7320508075689"],
["¯4○2j3","←→","1.9256697360917J3.1157990841034"],
["¯3○0.5","←→","0.46364760900081"],
["¯3○2","←→","1.107148717794090503017065460"],
["¯3○2j3","←→","1.409921049596575522530619385j0.2290726829685387662958818029"],
["¯2○0.5","←→","1.0471975511966"],
["¯2○2","←→","0J1.316957896924816708625046347"],
["¯2○2j3","←→","1.000143542473797218521037812J¯1.983387029916535432347076903"],
["¯1○0.5","←→","0.5235987755983"],
["¯1○2","←→","1.570796326794896619231321692J¯1.316957896924816708625046347"],
["¯1○2j3","←→","0.5706527843210994007102838797J1.983387029916535432347076903"],
["0○0.5","←→","0.86602540378444"],
["0○2","←→","0J1.7320508075689"],
["0○2j3","←→","3.1157990841034J¯1.9256697360917"],
["1e¯10>∣.5-1○○÷6","←→","1 # sin(pi/6) = .5"],
["1○1","←→","0.8414709848079"],
["1○2j3","←→","9.1544991469114J¯4.1689069599666"],
["2○1","←→","0.54030230586814"],
["2○2j3","←→","¯4.1896256909688J¯9.1092278937553"],
["3○1","←→","1.5574077246549"],
["3○2j3","←→","¯0.0037640256415041J1.0032386273536"],
["4○2","←→","2.2360679774998"],
["4○2j3","←→","2.0795565201111J2.8852305489054"],
["5○2","←→","3.626860407847"],
["5○2j3","←→","¯3.5905645899858J0.53092108624852"],
["6○2","←→","3.7621956910836"],
["6○2j3","←→","¯3.7245455049153J0.51182256998738"],
["7○2","←→","0.96402758007582"],
["7○2j3","←→","0.96538587902213J¯0.0098843750383225"],
["8○2","←→","0J2.2360679774998"],
["8○2j3","←→","2.8852305489054J¯2.0795565201111"],
["9○2","←→","2"],
["9○2j3","←→","2"],
["10○¯2","←→","2"],
["10○¯2j3","←→","3.605551275464"],
["11○2","←→","0"],
["11○2j3","←→","3"],
["12○2","←→","0"],
["12○2j3","←→","0.98279372324733"],
["1○'hello'","!!!","DOMAIN ERROR"],
["99○1","!!!","DOMAIN ERROR"],
["99○1j2","!!!","DOMAIN ERROR"],
["10,66","←→","10 66"],
["'10 ','MAY ','1985'","←→","'10 MAY 1985'"],
["(2 3⍴⍳6),2 2⍴⍳4","←→","2 5⍴(0 1 2 0 1  3 4 5 2 3)"],
["(3 2⍴⍳6),2 2⍴⍳4","!!!","LENGTH ERROR"],
["(2 3⍴⍳6),9","←→","2 4⍴(0 1 2 9  3 4 5 9)"],
["(2 3 4⍴⍳24),99","←→","2 3 5⍴(0  1  2  3 99\n                           4  5  6  7 99\n                           8  9 10 11 99\n\n                          12 13 14 15 99\n                          16 17 18 19 99\n                          20 21 22 23 99)"],
["⍬,⍬","←→","⍬"],
["⍬,1","←→",",1"],
["1,⍬","←→",",1"],
["12=12","←→","1"],
["2=12","←→","0"],
["\"Q\"=\"Q\"","←→","1"],
["1=\"1\"","←→","0"],
["\"1\"=1","←→","0"],
["11 7 2 9=11 3 2 6","←→","1 0 1 0"],
["\"STOAT\"=\"TOAST\"","←→","0 0 0 0 1"],
["8=2+2+2+2","←→","1"],
["(2 3⍴1 2 3 4 5 6)=2 3⍴3 3 3 5 5 5","←→","2 3⍴0 0 1 0 1 0"],
["3=2 3⍴1 2 3 4 5 6","←→","2 3⍴0 0 1 0 0 0"],
["3=(2 3⍴1 2 3 4 5 6)(2 3⍴3 3 3 5 5 5)","←→","(2 3⍴0 0 1 0 0 0)(2 3⍴1 1 1 0 0 0)"],
["2j3=2j3","←→","1"],
["2j3=3j2","←→","0"],
["0j0","←→","0"],
["123j0","←→","123"],
["2j¯3+¯2j3","←→","0"],
["=/⍬","←→","1"],
["3≢5","←→","1"],
["8≠8","←→","0"],
["≠/⍬","←→","0"],
["</⍬","←→","0"],
[">/⍬","←→","0"],
["≤/⍬","←→","1"],
["≥/⍬","←→","1"],
["3≡3","←→","1"],
["3≡,3","←→","0"],
["4 7.1 8≡4 7.2 8","←→","0"],
["(3 4⍴⍳12)≡3 4⍴⍳12","←→","1"],
["(3 4⍴⍳12)≡⊂3 4⍴⍳12","←→","0"],
["(\"ABC\" \"DEF\")≡\"ABCDEF\"","←→","0"],
["(2 0⍴0)≡(0 2⍴0)","←→","0"],
["≡4","←→","0"],
["≡⍳4","←→","1"],
["≡2 2⍴⍳4","←→","1"],
["≡\"abc\"1 2 3(23 55)","←→","2"],
["≡\"abc\"(2 4⍴\"abc\"2 3\"k\")","←→","3"],
["(÷∘-)2","←→","¯0.5"],
["8(÷∘-)2","←→","¯4"],
["÷∘-2","←→","¯0.5"],
["8÷∘-2","←→","¯4"],
["⍴∘⍴2 3⍴⍳6","←→",",2"],
["3⍴∘⍴2 3⍴⍳6","←→","2 3 2"],
["3∘-1","←→","2"],
["(-∘2)9","←→","7"],
["1 2∪2 3","←→","1 2 3"],
["'SHOCK'∪'CHOCOLATE'","←→","'SHOCKLATE'"],
["1∪1","←→",",1"],
["1∪2","←→","1 2"],
["1∪2 1","←→","1 2"],
["1 2∪2 2 2 2","←→","1 2"],
["1 2∪2 2⍴3","!!!","RANK ERROR"],
["(2 2⍴3)∪4 5","!!!","RANK ERROR"],
["⍬∪1","←→",",1"],
["1 2∪⍬","←→","1 2"],
["⍬∪⍬","←→","⍬"],
["2 3 3∪4 5 3 4","←→","2 3 3 4 5 4"],
["'lentils' 'bulghur'(3 4 5)∪'lentils' 'rice'","←→","'lentils' 'bulghur'(3 4 5)'rice'"],
["∪3 17 17 17 ¯3 17 0","←→","3 17 ¯3 0"],
["∪3 17","←→","3 17"],
["∪17","←→",",17"],
["∪⍬","←→","⍬"],
["'ABRA'∩'CAR'","←→","'ARA'"],
["1'PLUS'2∩⍳5","←→","1 2"],
["1∩2","←→","⍬"],
["1∩2 3⍴4","!!!","RANK ERROR"],
["∩1","!!!","NONCE ERROR"],
["10⊥3 2 6 9","←→","3269"],
["8⊥3 1","←→","25"],
["1760 3 12⊥1 2 8","←→","68"],
["2 2 2⊥1","←→","7"],
["0 20 12 4⊥2 15 6 3","←→","2667"],
["1760 3 12⊥3 3⍴1 1 1 2 0 3 0 1 8","←→","60 37 80"],
["60 60⊥3 13","←→","193"],
["0 60⊥3 13","←→","193"],
["60⊥3 13","←→","193"],
["2⊥1 0 1 0","←→","10"],
["2⊥1 2 3 4","←→","26"],
["3⊥1 2 3 4","←→","58"],
["M←(3 8⍴0 0 0 0 1 1 1 1\n    0 0 1 1 0 0 1 1\n    0 1 0 1 0 1 0 1)\n A←(4 3⍴1 1 1\n        2 2 2\n        3 3 3\n        4 4 4)\n A⊥M","←→","(4 8⍴0 1 1 2  1  2  2  3\n             0 1 2 3  4  5  6  7\n             0 1 3 4  9 10 12 13\n             0 1 4 5 16 17 20 21)"],
["M←(3 8⍴0 0 0 0 1 1 1 1\n    0 0 1 1 0 0 1 1\n    0 1 0 1 0 1 0 1)\n 2⊥M","←→","0 1 2 3 4 5 6 7"],
["M←(3 8 ⍴0 0 0 0 1 1 1 1\n     0 0 1 1 0 0 1 1\n     0 1 0 1 0 1 0 1)\n A←2 1⍴2 10\n A⊥M","←→","(2 8⍴0 1  2  3   4   5   6   7\n             0 1 10 11 100 101 110 111)"],
["2 3 4∘.×1 2 3 4","←→","(3 4⍴2 4  6  8\n                     3 6  9 12\n                     4 8 12 16)"],
["0 1 2 3 4∘.!0 1 2 3 4","←→","(5 5⍴1 1 1 1 1\n                           0 1 2 3 4\n                           0 0 1 3 6\n                           0 0 0 1 4\n                           0 0 0 0 1)"],
["1 2∘.,1+⍳3","←→","(2 3⍴(1 1)(1 2)(1 3)\n                (2 1)(2 2)(2 3))"],
["⍴1 2∘.,1+⍳3","←→","2 3"],
["2 3∘.↑1 2","←→","(2 2⍴  (1 0)   (2 0)\n               (1 0 0) (2 0 0))"],
["⍴2 3∘.↑1 2","←→","2 2"],
["⍴((4 3⍴0)∘.+5 2⍴0)","←→","4 3 5 2"],
["2 3∘.×4 5","←→","2 2⍴8 10 12 15"],
["2 3∘ . ×4 5","←→","2 2⍴8 10 12 15"],
["2 3∘.{⍺×⍵}4 5","←→","2 2⍴8 10 12 15"],
["(1 3 5 7)+.=2 3 6 7","←→","2"],
["(1 3 5 7)∧.=2 3 6 7","←→","0"],
["(1 3 5 7)∧.=1 3 5 7","←→","1"],
["7+.=8 8 7 7 8 7 5","←→","3"],
["8 8 7 7 8 7 5+.=7","←→","3"],
["7+.=7","←→","1"],
["(3 2⍴5 ¯3 ¯2 4 ¯1 0)+.×2 2⍴6 ¯3 5 7","←→","3 2⍴15 ¯36 8 34 ¯6 3"],
["⍴¨(0 0 0 0)(0 0 0)","←→","(,4)(,3)"],
["⍴¨\"MONDAY\" \"TUESDAY\"","←→","(,6)(,7)"],
["⍴   (2 2⍴⍳4)(⍳10)97.3(3 4⍴\"K\")","←→",",4"],
["⍴¨  (2 2⍴⍳4)(⍳10)97.3(3 4⍴\"K\")","←→","(2 2)(,10)⍬(3 4)"],
["⍴⍴¨ (2 2⍴⍳4)(⍳10)97.3(3 4⍴\"K\")","←→",",4"],
["⍴¨⍴¨(2 2⍴⍳4)(⍳10)97.3(3 4⍴\"K\")","←→","(,2)(,1)(,0)(,2)"],
["(1 2 3) ,¨ 4 5 6","←→","(1 4)(2 5)(3 6)"],
["2 3↑¨'MONDAY' 'TUESDAY'","←→","'MO' 'TUE'"],
["2↑¨'MONDAY' 'TUESDAY'","←→","'MO' 'TU'"],
["2 3⍴¨1 2","←→","(1 1)(2 2 2)"],
["4 5⍴¨\"THE\" \"CAT\"","←→","'THET' 'CATCA'"],
["{1+⍵*2}¨2 3⍴⍳6","←→","2 3⍴1 2 5 10 17 26"],
["1760 3 12⊤75","←→","2 0 3"],
["3 12⊤75","←→","0 3"],
["100000 12⊤75","←→","6 3"],
["16 16 16 16⊤100","←→","0 0 6 4"],
["1760 3 12⊤75.3","←→","2 0(75.3-72)"],
["0 1⊤75.3","←→","75(75.3-75)"],
["2 2 2 2 2⊤1 2 3 4 5","←→","(5 5⍴0 0 0 0 0\n                         0 0 0 0 0\n                         0 0 0 1 1\n                         0 1 1 0 0\n                         1 0 1 0 1)"],
["10⊤5 15 125","←→","5 5 5"],
["0 10⊤5 15 125","←→","2 3⍴0 1 12 5 5 5"],
["(8 3⍴2 0 0\n  2 0 0\n  2 0 0\n  2 0 0\n  2 8 0\n  2 8 0\n  2 8 16\n  2 8 16)⊤75","←→","(8 3⍴0 0 0\n         1 0 0\n         0 0 0\n         0 0 0\n         1 0 0\n         0 1 0\n         1 1 4\n         1 3 11)"],
["2 3 4 5 6∊1 2 3 5 8 13 21","←→","1 1 0 1 0"],
["5∊1 2 3 5 8 13 21","←→","1"],
["∊17","←→",",17"],
["⍴∊(1 2 3)\"ABC\"(4 5 6)","←→",",9"],
["∊2 2⍴(1+2 2⍴⍳4)\"DEF\"(1+2 3⍴⍳6)(7 8 9)","←→","1 2 3 4,'DEF',1 2 3 4 5 6 7 8 9"],
["!5","←→","120"],
["!21","←→","51090942171709440000"],
["!0","←→","1"],
["!1.5","←→","1.3293403881791"],
["!¯1.5","←→","¯3.544907701811"],
["!¯2.5","←→","2.3632718012074"],
["!¯200.5","←→","0"],
["!¯1","!!!","DOMAIN ERROR"],
["!¯200","!!!","DOMAIN ERROR"],
["2!4","←→","6"],
["3!20","←→","1140"],
["2!6 12 20","←→","15 66 190"],
["(2 3⍴1+⍳6)!2 3⍴3 6 9 12 15 18","←→","2 3⍴3 15 84 495 3003 18564"],
["0.5!1","←→","1.2732395447351612"],
["1.2!3.4","←→","3.795253463731253"],
["!/⍬","←→","1"],
["(2!1000)=499500","←→","1"],
["(998!1000)=499500","←→","1"],
["3!5","←→","10  #    0   0   0      (!⍵)÷(!⍺)×!⍵-⍺"],
["5!3","←→","0   #    0   0   1      0"],
["3!¯5","←→","¯35 #    0   1   1      (¯1*⍺)×⍺!⍺-⍵+1"],
["¯3!5","←→","0   #    1   0   0      0"],
["¯5!¯3","←→","6   #    1   1   0      (¯1*⍵-⍺)×(|⍵+1)!(|⍺+1)"],
["¯3!¯5","←→","0   #    1   1   1      0"],
["0.5!¯1","!!!","DOMAIN ERROR"],
["⍎'+/ 2 2 ⍴ 1 2 3 4'","←→","3 7"],
["⍴⍎'123 456'","←→",",2"],
["⍎'{⍵*2} ⍳5'","←→","0 1 4 9 16"],
["\"AN\"⍷\"BANANA\"","←→","0 1 0 1 0 0"],
["\"BIRDS\" \"NEST\"⍷\"BIRDS\" \"NEST\" \"SOUP\"","←→","1 0 0"],
["\"ME\"⍷\"HOME AGAIN\"","←→","0 0 1 0 0 0 0 0 0 0"],
["\"DAY\"⍷7 9⍴(\"SUNDAY   \",\n        \"MONDAY   \",\n        \"TUESDAY  \",\n        \"WEDNESDAY\",\n        \"THURSDAY \",\n        \"FRIDAY   \",\n        \"SATURDAY \")","←→","(7 9⍴0 0 0 1 0 0 0 0 0\n         0 0 0 1 0 0 0 0 0\n         0 0 0 0 1 0 0 0 0\n         0 0 0 0 0 0 1 0 0\n         0 0 0 0 0 1 0 0 0\n         0 0 0 1 0 0 0 0 0\n         0 0 0 0 0 1 0 0 0)"],
["(2 2⍴\"ABCD\")⍷\"ABCD\"","←→","4 ⍴ 0"],
["(1 2)(3 4)⍷\"START\"(1 2 3)(1 2)(3 4)","←→","0 0 1 0"],
["(2 2⍴7 8 12 13)⍷1+4 5⍴⍳20","←→","4 5⍴(0 0 0 0 0\n         0 1 0 0 0\n         0 0 0 0 0\n         0 0 0 0 0)"],
["1⍷⍳5","←→","0 1 0 0 0"],
["1 2⍷⍳5","←→","0 1 0 0 0"],
["⍬⍷⍳5","←→","1 1 1 1 1"],
["⍬⍷⍬","←→","⍬"],
["1⍷⍬","←→","⍬"],
["1 2 3⍷⍬","←→","⍬"],
["(2 3 0⍴0)⍷(3 4 5⍴0)","←→","3 4 5⍴1"],
["(2 3 4⍴0)⍷(3 4 0⍴0)","←→","3 4 0⍴0"],
["(2 3 0⍴0)⍷(3 4 0⍴0)","←→","3 4 0⍴0"],
["⌊123","←→","123"],
["⌊12.3","←→","12"],
["⌊¯12.3","←→","¯13"],
["⌊¯123","←→","¯123"],
["⌊'a'","!!!","DOMAIN ERROR"],
["⌊12j3","←→","12j3"],
["⌊1.2j2.3","←→","1j2"],
["⌊1.2j¯2.3","←→","1j¯3"],
["⌊¯1.2j2.3","←→","¯1j2"],
["⌊¯1.2j¯2.3","←→","¯1j¯3"],
["⌊0 5 ¯5 (○1) ¯1.5","←→","0 5 ¯5 3 ¯2"],
["3⌊5","←→","3"],
["⌊/⍬","←→","¯"],
["⌈123","←→","123"],
["⌈12.3","←→","13"],
["⌈¯12.3","←→","¯12"],
["⌈¯123","←→","¯123"],
["⌈'a'","!!!","DOMAIN ERROR"],
["⌈12j3","←→","12j3"],
["⌈1.2j2.3","←→","1j3"],
["⌈1.2j¯2.3","←→","1j¯2"],
["⌈¯1.2j2.3","←→","¯1j3"],
["⌈¯1.2j¯2.3","←→","¯1j¯2"],
["⌈0 5 ¯5(○1)¯1.5","←→","0 5 ¯5 4 ¯1"],
["3⌈5","←→","5"],
["⌈/⍬","←→","¯¯"],
["(+/÷⍴)4 5 10 7","←→",",6.5"],
["a←1 ⋄ b←¯22 ⋄ c←85\n √←{⍵*.5}\n ((-b)(+,-)√(b*2)-4×a×c)÷2×a","←→","17 5"],
["(+,-,×,÷)2","←→","2 ¯2 1 .5"],
["1(+,-,×,÷)2","←→","3 ¯1 2 .5"],
["⍕123","←→","1 3⍴'123'"],
["⍕123 456","←→","1 7⍴'123 456'"],
["⍕123 'a'","←→","1 5⍴'123 a'"],
["⍕12 'ab'","←→","1 7⍴'12  ab '"],
["⍕1 2⍴'a'","←→","1 2⍴'a'"],
["⍕2 2⍴'a'","←→","2 2⍴'a'"],
["⍕2 2⍴5","←→","2 3⍴('5 5',\n                     '5 5')"],
["⍕2 2⍴0 0 0 'a'","←→","2 3⍴('0 0',\n                     '0 a')"],
["⍕2 2⍴0 0 0 'ab'","←→","2 6⍴('0   0 ',\n                     '0  ab ')"],
["⍕2 2⍴0 0 0 123","←→","2 5⍴('0   0',\n                     '0 123')"],
["⍕4 3 ⍴ '---' '---' '---' 1 2 3 4 5 6 100 200 300","←→","4 17⍴(' ---   ---   --- ',\n                      '   1     2     3 ',\n                      '   4     5     6 ',\n                      ' 100   200   300 ')"],
["⍕1 ⍬ 2 '' 3","←→","1 11⍴'1    2    3'"],
["⍕∞","←→","1 1⍴'∞'"],
["⍕¯∞","←→","1 2⍴'¯∞'"],
["⍕¯1","←→","1 2⍴'¯1'"],
["⍕¯1e¯100J¯2e¯99","←→","1 14⍴'¯1e¯100J¯2e¯99'"],
["⍋13 8 122 4","←→","3 1 0 2"],
["a←13 8 122 4 ⋄ a[⍋a]","←→","4 8 13 122"],
["⍋\"ZAMBIA\"","←→","1 5 3 4 2 0"],
["s←\"ZAMBIA\" ⋄ s[⍋s]","←→","'AABIMZ'"],
["t←3 3⍴\"BOBALFZAK\" ⋄ ⍋t","←→","1 0 2"],
["t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ ⍋t","←→","2 1 0"],
["t←3 3⍴4 5 6 1 1 3 1 1 2 ⋄ t[⍋t;]","←→","(3 3⍴ 1 1 2\n              1 1 3\n              4 5 6)"],
["a←3 2 3⍴2 3 4 0 1 0 1 1 3 4 5 6 1 1 2 10 11 12 ⋄ a[⍋a;;]","←→","(3 2 3⍴ 1  1  2\n           10 11 12\n\n            1  1  3\n            4  5  6\n\n            2  3  4\n            0  1  0)"],
["a←3 2 5⍴\"joe  doe  bob  jonesbob  zwart\"  ⋄  a[⍋a;;]","←→","3 2 5 ⍴ 'bob  jonesbob  zwartjoe  doe  '"],
["\"ZYXWVUTSRQPONMLKJIHGFEDCBA\"⍋\"ZAMBIA\"","←→","0 2 4 3 1 5"],
["⎕A←\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\" ⋄ (⌽⎕A)⍋3 3⍴\"BOBALFZAK\"","←→","2 0 1"],
["data←6 4⍴\"ABLEaBLEACREABELaBELACES\"\n coll←2 26⍴\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\"\n data[coll⍋data;]","←→","6 4⍴'ABELaBELABLEaBLEACESACRE'"],
["data←6 4⍴\"ABLEaBLEACREABELaBELACES\"\n coll1←\"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz\"\n data[coll1⍋data;]","←→","6 4⍴'ABELABLEACESACREaBELaBLE'"],
["⍋0 1 2 3 4 3 6 6 4 9 1 11 12 13 14 15","←→","0 1 10 2 3 5 4 8 6 7 9 11 12 13 14 15"],
["⍒3 1 8","←→","2 0 1"],
["f←{⍺+2×⍵} ⋄ f/⍬","!!!","DOMAIN ERROR"],
["f←{⍺+2×⍵} ⋄ (f⍁123)/⍬","←→","123"],
["f←{⍺+2×⍵} ⋄ (456⍁f)/⍬","←→","456"],
["f←{⍺+2×⍵} ⋄ g←f⍁789 ⋄ f/⍬","!!!","DOMAIN ERROR"],
["{}⍁1 2","!!!","RANK ERROR"],
["({}⍁(1 1 1⍴123))/⍬","←→","123"],
["2 5 9 14 20⍳9","←→","2"],
["2 5 9 14 20⍳6","←→","5"],
["\"GORSUCH\"⍳\"S\"","←→","3"],
["\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"⍳\"CARP\"","←→","2 0 17 15"],
["\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"⍳\"PORK PIE\"","←→","15 14 17 10 26 15 8 4"],
["\"MON\" \"TUES\" \"WED\"⍳\"MON\" \"THURS\"","←→","0 3"],
["1 3 2 0 3⍳⍳5","←→","3 0 2 1 5"],
["\"CAT\" \"DOG\" \"MOUSE\"⍳\"DOG\" \"BIRD\"","←→","1 3"],
["123⍳123","!!!","RANK ERROR"],
["(2 2⍴123)⍳123","!!!","RANK ERROR"],
["123 123⍳123","←→","0"],
["⍬⍳123 234","←→","0 0"],
["123 234⍳⍬","←→","⍬"],
["⍳5","←→","0 1 2 3 4"],
["⍴⍳5","←→","1 ⍴ 5"],
["⍳0","←→","⍬"],
["⍴⍳0","←→",",0"],
["⍳2 3 4","←→","(2 3 4⍴(0 0 0)(0 0 1)(0 0 2)(0 0 3)\n              (0 1 0)(0 1 1)(0 1 2)(0 1 3)\n              (0 2 0)(0 2 1)(0 2 2)(0 2 3)\n              (1 0 0)(1 0 1)(1 0 2)(1 0 3)\n              (1 1 0)(1 1 1)(1 1 2)(1 1 3)\n              (1 2 0)(1 2 1)(1 2 2)(1 2 3))"],
["⍴⍳2 3 4","←→","2 3 4"],
["⍳¯1","!!!","DOMAIN ERROR"],
["⍴⊂2 3⍴⍳6","←→","⍬"],
["⍴⍴⊂2 3⍴⍳6","←→",",0"],
["⊂[0]2 3⍴⍳6","←→","(0 3)(1 4)(2 5)"],
["⍴⊂[0]2 3⍴⍳6","←→",",3"],
["⊂[1]2 3⍴⍳6","←→","(0 1 2)(3 4 5)"],
["⍴⊂[1]2 3⍴⍳6","←→",",2"],
["⊃⊂[1 0]2 3⍴⍳6","←→","3 2⍴0 3 1 4 2 5"],
["⍴⊂[1 0]2 3⍴⍳6","←→","⍬"],
["⍴⊃⊂⊂1 2 3","←→","⍬"],
["~0 1","←→","1 0"],
["~2","!!!","DOMAIN ERROR"],
["1∨1","←→","1"],
["1∨0","←→","1"],
["0∨1","←→","1"],
["0∨0","←→","0"],
["0 0 1 1 ∨ 0 1 0 1","←→","0 1 1 1"],
["12∨18","←→","6 ⍝ 12=2×2×3, 18=2×3×3"],
["299∨323","←→","1 ⍝ 299=13×23, 323=17×19"],
["12345∨12345","←→","12345"],
["0∨123","←→","123"],
["123∨0","←→","123"],
["∨/⍬","←→","0"],
["¯12∨18","←→","6"],
["12∨¯18","←→","6"],
["¯12∨¯18","←→","6"],
["1.5∨2.5","!!!","DOMAIN ERROR"],
["'a'∨1","!!!","DOMAIN ERROR"],
["1∨'a'","!!!","DOMAIN ERROR"],
["'a'∨'b'","!!!","DOMAIN ERROR"],
["135j¯14∨155j34","←→","5j12"],
["2 3 4∨0j1 1j2 2j3","←→","1 1 1"],
["2j2 2j4∨5j5 4j4","←→","1j1 2"],
["1∧1","←→","1"],
["1∧0","←→","0"],
["0∧1","←→","0"],
["0∧0","←→","0"],
["0 0 1 1∧0 1 0 1","←→","0 0 0 1"],
["0 0 0 1 1∧1 1 1 1 0","←→","0 0 0 1 0"],
["t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ 1∧t","←→","3 3 ⍴ 1 1 1 0 0 0 1 0 1"],
["t←3 3⍴1 1 1 0 0 0 1 0 1 ⋄ ∧/t","←→","1 0 0"],
["12∧18   # 12=2×2×3, 18=2×3×3","←→","36"],
["299∧323 # 299=13×23, 323=17×19","←→","96577"],
["12345∧12345","←→","12345"],
["0∧123","←→","0"],
["123∧0","←→","0"],
["∧/⍬","←→","1"],
["¯12∧18","←→","¯36"],
["12∧¯18","←→","¯36"],
["¯12∧¯18","←→","36"],
["1.5∧2.5","!!!","DOMAIN ERROR"],
["'a'∧1","!!!","DOMAIN ERROR"],
["1∧'a'","!!!","DOMAIN ERROR"],
["'a'∧'b'","!!!","DOMAIN ERROR"],
["135j¯14∧155j34","←→","805j¯1448"],
["2 3 4∧0j1 1j2 2j3","←→","0j2 3j6 8j12"],
["2j2 2j4∧5j5 4j4","←→","10j10 ¯4j12"],
["0⍱0","←→","1"],
["0⍱1","←→","0"],
["1⍱0","←→","0"],
["1⍱1","←→","0"],
["0⍱2","!!!","DOMAIN ERROR"],
["0⍲0","←→","1"],
["0⍲1","←→","1"],
["1⍲0","←→","1"],
["1⍲1","←→","0"],
["0⍲2","!!!","DOMAIN ERROR"],
["({⍵+1}⍣5) 3","←→","8"],
["({⍵+1}⍣0) 3","←→","3"],
["(⍴⍣3)2 2⍴⍳4","←→",",1"],
["'a'(,⍣3)'b'","←→","'aaab'"],
["1{⍺+÷⍵}⍣=1","←→","1.618033988749895"],
["c←0 ⋄ 5⍣{c←c+1}0 ⋄ c","←→","5"],
["⎕IO","←→","0"],
["⎕IO←0","←→","0"],
["'b(c+)d'⎕RE'abcd'","←→","1 'bcd' (,'c')"],
["'B(c+)d'⎕RE'abcd'","←→","⍬"],
["'a(b'   ⎕RE'c'","!!!","DOMAIN ERROR"],
["⎕UCS'a'","←→","97"],
["⎕UCS'ab'","←→","97 98"],
["⎕UCS 2 2⍴97+⍳4","←→","2 2⍴'abcd'"],
["n←6 ⋄ r←?n ⋄ (0≤r)∧(r<n)","←→","1"],
["?0","!!!","DOMAIN ERROR"],
["?1","←→","0"],
["?1.5","!!!","DOMAIN ERROR"],
["?'a'","!!!","DOMAIN ERROR"],
["?1j2","!!!","DOMAIN ERROR"],
["?∞","!!!","DOMAIN ERROR"],
["n←100 ⋄ (+/n?n)=(+/⍳n)","←→","1 # a permutation (an \"n?n\" dealing) contains all 0...n"],
["n←100 ⋄ A←(n÷2)?n ⋄ ∧/(0≤A),A<n","←→","1 # any number x in a dealing is 0 <= x < n"],
["0?100","←→","⍬"],
["0?0","←→","⍬"],
["1?1","←→",",0"],
["1?1 1","!!!","LENGTH ERROR"],
["5?3","!!!","DOMAIN ERROR"],
["¯1?3","!!!","DOMAIN ERROR"],
["↗'CUSTOM ERROR'","!!!","CUSTOM ERROR"],
["⍴1 2 3⍴0","←→","1 2 3"],
["⍴⍴1 2 3⍴0","←→",",3"],
["3 3⍴⍳4","←→","3 3⍴0 1 2 3 0 1 2 3 0"],
["⍴3 3⍴⍳4","←→","3 3"],
["⍬⍴123","←→","123"],
["⍬⍴⍬","←→","0"],
["2 3⍴⍬","←→","2 3⍴0"],
["2 3⍴⍳7","←→","2 3⍴0 1 2 3 4 5"],
["⍴1e9⍴0","←→",",1e9"],
["⍴0","←→","0⍴0"],
["⍴0 0","←→","1⍴2"],
["⍴⍴0","←→","1⍴0"],
["⍴⍴⍴0","←→","1⍴1"],
["⍴⍴⍴0 0","←→","1⍴1"],
["⍴'a'","←→","0⍴0"],
["⍴'ab'","←→","1⍴2"],
["⍴2 3 4⍴0","←→","2 3 4"],
["1⌽1 2 3 4 5 6","←→","2 3 4 5 6 1"],
["3⌽'ABCDEFGH'","←→","'DEFGHABC'"],
["3⌽2 5⍴1 2 3 4 5 6 7 8 9 0","←→","2 5⍴4 5 1 2 3 9 0 6 7 8"],
["¯2⌽\"ABCDEFGH\"","←→","'GHABCDEF'"],
["1⌽3 3⍴⍳9","←→","3 3⍴1 2 0 4 5 3 7 8 6"],
["0⌽1 2 3 4","←→","1 2 3 4"],
["0⌽1234","←→","1234"],
["5⌽⍬","←→","⍬"],
["⌽1 2 3 4 5 6","←→","6 5 4 3 2 1"],
["⌽(1 2)(3 4)(5 6)","←→","(5 6)(3 4)(1 2)"],
["⌽\"BOB WON POTS\"","←→","'STOP NOW BOB'"],
["⌽    2 5⍴1 2 3 4 5 6 7 8 9 0","←→","2 5⍴5 4 3 2 1 0 9 8 7 6"],
["⌽[0] 2 5⍴1 2 3 4 5 6 7 8 9 0","←→","2 5⍴6 7 8 9 0 1 2 3 4 5"],
["⊖1 2 3 4 5 6","←→","6 5 4 3 2 1"],
["⊖(1 2) (3 4) (5 6)","←→","(5 6)(3 4)(1 2)"],
["⊖'BOB WON POTS'","←→","'STOP NOW BOB'"],
["⊖    2 5⍴1 2 3 4 5 6 7 8 9 0","←→","2 5⍴6 7 8 9 0 1 2 3 4 5"],
["⊖[1] 2 5⍴1 2 3 4 5 6 7 8 9 0","←→","2 5⍴5 4 3 2 1 0 9 8 7 6"],
["1⊖3 3⍴⍳9","←→","3 3⍴3 4 5 6 7 8 0 1 2"],
["+/3","←→","3"],
["+/3 5 8","←→","16"],
["⌈/82 66 93 13","←→","93"],
["×/2 3⍴1 2 3 4 5 6","←→","6 120"],
["2,/'ab' 'cd' 'ef' 'hi'","←→","'abcd' 'cdef' 'efhi'"],
["3,/'ab' 'cd' 'ef' 'hi'","←→","'abcdef' 'cdefhi'"],
["-/3 0⍴42","←→","3⍴0"],
["2+/1+⍳10","←→","3 5 7 9 11 13 15 17 19"],
["5+/1+⍳10","←→","15 20 25 30 35 40"],
["10+/1+⍳10","←→",",55"],
["11+/1+⍳10","←→","⍬"],
["12+/1+⍳10","!!!","LENGTH ERROR"],
["2-/3 4 9 7","←→","¯1 ¯5 2"],
["¯2-/3 4 9 7","←→","1 5 ¯2"],
["0 1 0 1/'abcd'","←→","'bd'"],
["1 1 1 1 0/12 14 16 18 20","←→","12 14 16 18"],
["m←45 60 33 50 66 19 ⋄ (m≥50)/m","←→","60 50 66"],
["m←45 60 33 50 66 19 ⋄ (m=50)/⍳≢m","←→",",3"],
["1/'ab'","←→","'ab'"],
["0/'ab'","←→","⍬"],
["0 1 0/ 1+2 3⍴⍳6","←→","2 1⍴2 5"],
["1 0/[0]1+2 3⍴⍳6","←→","1 3⍴1 2 3"],
["1 0⌿   1+2 3⍴⍳6","←→","1 3⍴1 2 3"],
["3/5","←→","5 5 5"],
["2 ¯2 2/1+2 3⍴⍳6","←→","2 6⍴  1 1 0 0 3 3  4 4 0 0 6 6"],
["1 1 ¯2 1 1/1 2(2 2⍴⍳4)3 4","←→","1 2 0 0 3 4"],
["2 3 2/'abc'","←→","'aabbbcc'"],
["2/'def'","←→","'ddeeff'"],
["5 0 5/1 2 3","←→","1 1 1 1 1 3 3 3 3 3"],
["2/1+2 3⍴⍳6","←→","2 6⍴ 1 1 2 2 3 3  4 4 5 5 6 6"],
["2⌿1+2 3⍴⍳6","←→","4 3⍴ 1 2 3  1 2 3  4 5 6  4 5 6"],
["2 3/3 1⍴'abc'","←→","3 5⍴'aaaaabbbbbccccc'"],
["2 ¯1 2/[1]3 1⍴7 8 9","←→","3 5⍴7 7 0 7 7 8 8 0 8 8 9 9 0 9 9"],
["2 ¯1 2/[1]3 1⍴'abc'","←→","3 5⍴'aa aabb bbcc cc'"],
["2 ¯2 2/7","←→","7 7 0 0 7 7"],
["1⌷3 5 8","←→","5"],
["(3 5 8)[1]","←→","5"],
["(3 5 8)[⍬]","←→","⍬"],
["(2 2 0)(1 2)⌷3 3⍴⍳9","←→","3 2⍴7 8 7 8 1 2"],
["¯1⌷3 5 8","!!!","INDEX ERROR"],
["2⌷111 222 333 444","←→","333"],
["(⊂3 2)⌷111 222 333 444","←→","444 333"],
["(⊂2 3⍴2 0 3 0 1 2)⌷111 222 333 444","←→","2 3⍴333 111 444 111 222 333"],
["1 0   ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34","←→","21"],
["1     ⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34","←→","21 22 23 24"],
["2(1 0)⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34","←→","32 31"],
["(1 2)0⌷3 4⍴11 12 13 14 21 22 23 24 31 32 33 34","←→","21 31"],
["a←2 2⍴0 ⋄ a[;0]←1 ⋄ a","←→","2 2⍴1 0 1 0"],
["a←2 3⍴0 ⋄ a[1;0 2]←1 ⋄ a","←→","2 3⍴0 0 0 1 0 1"],
["(23 54 38)[0]","←→","23"],
["(23 54 38)[1]","←→","54"],
["(23 54 38)[2]","←→","38"],
["(23 54 38)[3]","!!!","INDEX ERROR"],
["(23 54 38)[¯1]","!!!","INDEX ERROR"],
["(23 54 38)[0 2]","←→","23 38"],
["(2 3⍴100 101 102 110 111 112)[1;2]","←→","112"],
["(2 3⍴100 101 102 110 111 112)[1;¯1]","!!!","INDEX ERROR"],
["(2 3⍴100 101 102 110 111 112)[10;1]","!!!","INDEX ERROR"],
["(2 3⍴100 101 102 110 111 112)[1;]","←→","110 111 112"],
["(2 3⍴100 101 102 110 111 112)[;1]","←→","101 111"],
["'hello'[1]","←→","'e'"],
["'ipodlover'[1 2 5 8 3 7 6 0 4]","←→","'poordevil'"],
["('axlrose'[4 3 0 2 5 6 1])[0 1 2 3]","←→","'oral'"],
["(1 2 3)[⍬]","←→","⍬"],
["⍴(1 2 3)[1 2 3 0 5⍴0]","←→","1 2 3 0 5"],
["(⍳3)[]","←→","⍳3"],
["⍴(3 3⍴⍳9)[⍬;⍬]","←→","0 0"],
["\" X\"[(3 3⍴⍳9)∊1 3 6 7 8]","←→","3 3⍴(' X ',\n                              'X  ',\n                              'XXX')"],
["a←⍳5 ⋄ a[1 3]←7 8 ⋄ a","←→","0 7 2 8 4"],
["a←⍳5 ⋄ a[1 3]←7   ⋄ a","←→","0 7 2 7 4"],
["a←⍳5 ⋄ a[1]  ←7 8 ⋄ a","!!!","RANK ERROR"],
["a←1 2 3 ⋄ a[1]←4 ⋄ a","←→","1 4 3"],
["a←2 2⍴⍳4 ⋄ a[0;0]←4 ⋄ a","←→","2 2⍴4 1 2 3"],
["a←5 5⍴0 ⋄ a[1 3;2 4]←2 2⍴1+⍳4 ⋄ a","←→","5 5⍴(0 0 0 0 0\n                                       0 0 1 0 2\n                                       0 0 0 0 0\n                                       0 0 3 0 4\n                                       0 0 0 0 0)"],
["a←'this is a test' ⋄ a[0 5]←'TI'","←→","'This Is a test'"],
["Data←0 4 8 ⋄ 10+ (Data[0 2]← 7 9)","←→","17 14 19"],
["a←3 4⍴⍳12 ⋄ a[;1 2]←99","←→","3 4⍴0 99 99 3 4 99 99 7 8 99 99 11"],
["a←1 2 3 ⋄ a[⍬]←4 ⋄ a","←→","1 2 3"],
["a←3 3⍴⍳9 ⋄ a[⍬;1 2]←789 ⋄ a","←→","3 3⍴⍳9"],
["a←1 2 3 ⋄ a[]←4 5 6 ⋄ a","←→","4 5 6"],
["5↑'ABCDEFGH'","←→","'ABCDE'"],
["¯3↑'ABCDEFGH'","←→","'FGH'"],
["3↑22 2 19 12","←→","22 2 19"],
["¯1↑22 2 19 12","←→",",12"],
["⍴1↑(2 2⍴⍳4)(⍳10)","←→",",1"],
["2↑1","←→","1 0"],
["5↑40 92 11","←→","40 92 11 0 0"],
["¯5↑40 92 11","←→","0 0 40 92 11"],
["3 3↑1 1⍴0","←→","3 3⍴0 0 0 0 0 0 0 0 0"],
["5↑\"abc\"","←→","'abc  '"],
["¯5↑\"abc\"","←→","'  abc'"],
["3 3↑1 1⍴\"a\"","←→","3 3⍴'a        '"],
["2 3↑1+4 3⍴⍳12","←→","2 3⍴1 2 3 4 5 6"],
["¯1 3↑1+4 3⍴⍳12","←→","1 3⍴10 11 12"],
["1 2↑1+4 3⍴⍳12","←→","1 2⍴1 2"],
["3↑⍬","←→","0 0 0"],
["¯2↑⍬","←→","0 0"],
["0↑⍬","←→","⍬"],
["3 3↑1","←→","3 3⍴1 0 0 0 0 0 0 0 0"],
["2↑3 3⍴⍳9","←→","2 3⍴⍳6"],
["¯2↑3 3⍴⍳9","←→","2 3⍴3+⍳6"],
["4↑3 3⍴⍳9","←→","4 3⍴(⍳9),0 0 0"],
["⍬↑3 3⍴⍳9","←→","3 3⍴⍳9"],
["↑(1 2 3)(4 5 6)","←→","1 2 3"],
["↑(1 2)(3 4 5)","←→","1 2"],
["↑'AB'","←→","'A'"],
["↑123","←→","123"],
["↑⍬","←→","0"],
["(2 2⍴⍳4)⍉2 2 2 2⍴⍳16","!!!","RANK ERROR"],
["0⍉3 5 8","←→","3 5 8"],
["1 0⍉2 2 2⍴⍳8","!!!","LENGTH ERROR"],
["¯1⍉1 2","!!!","DOMAIN ERROR"],
["'a'⍉1 2","!!!","DOMAIN ERROR"],
["2⍉1 2","!!!","RANK ERROR"],
["2 0 1⍉2 3 4⍴⍳24","←→","3 4 2⍴0 12 1 13 2 14 3 15 4 16 5 17 6 18 7 19 8 20 9 21 10 22 11 23"],
["2 0 0⍉2 3 4⍴⍳24","!!!","RANK ERROR"],
["0 0⍉3 3⍴⍳9","←→","0 4 8"],
["0 0⍉2 3⍴⍳9","←→","0 4"],
["0 0 0⍉3 3 3⍴⍳27","←→","0 13 26"],
["0 1 0⍉3 3 3⍴⍳27","←→","3 3⍴0 3 6 10 13 16 20 23 26"],
["⍉2 3⍴1 2 3 6 7 8","←→","3 2⍴1 6 2 7 3 8"],
["⍴⍉2 3⍴1 2 3 6 7 8","←→","3 2"],
["⍉1 2 3","←→","1 2 3"],
["⍉2 3 4⍴⍳24","←→","(4 3 2⍴0 12  4 16   8 20\n                         1 13  5 17   9 21\n                         2 14  6 18  10 22\n                         3 15  7 19  11 23)"],
["⍉⍬","←→","⍬"],
["⍉''","←→","''"],
["({'monadic'}⍠{'dyadic'})0","←→","'monadic'"],
["0({'monadic'}⍠{'dyadic'})0","←→","'dyadic'"]
]
