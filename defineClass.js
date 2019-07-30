var defineClass = (function(){
	var classDefinitions = {};

	function extend(a , b){
		for(var k in b){
			a[k] = b[k];
		}
	}

	function getType(arg){
		return Object.prototype.toString.call(arg).replace('[object ','').replace(']' , '');
	}

	function mixinMembers(publicMembers , privateMembers , classDef){
		for(var i=0 ; i<classDef.parentClasses.length ; i++){
			var className = classDef.parentClasses[i];
			if(className in classDefinitions){
				mixinMembers(publicMembers , privateMembers , classDefinitions[className]);
			}
		}

		extend(publicMembers , classDef.publicMembers);
		extend(privateMembers , classDef.privateMembers);
	}

	function getParentsDefs(classDef){
		var defs = [];
		for(var i=0 ; i<classDef.parentClasses.length ; i++){
			var pdef = classDefinitions[classDef.parentClasses[i]];
			if(pdef){
				defs.push(pdef);
				if(pdef.parentClasses.length){
					defs = defs.concat(getParentsDefs(pdef));
				}
				
			}
		}
		return defs;
	}

	return function(/*name , parentClasses , constructor , publicMembers , privateMembers*/){ 
		var classDef = {
			name : '',
			parentClasses : [],
			constructor : function(){},
			publicMembers : {},
			privateMembers : {}
		};
		
		var argobj = false;
		for(var i=0 ; i<arguments.length ; i++){
			var arg = arguments[i];
			switch(getType(arg)){
				case 'String':
					classDef.name = arg;
					break;
				case 'Array':
					classDef.parentClasses = arg;
					break;
				case 'Function':
					classDef.constructor = arg;
					break;
				case 'Object':
					if(argobj){
						classDef.privateMembers = arg;
					}else{
						classDef.publicMembers = arg;
						argobj = true;
					}
				default:
					break;
			}
		}
		classDefinitions[classDef.name] = classDef;
		
		var publicMembers = {};
		var privateMembers = {};
		mixinMembers(publicMembers , privateMembers , classDef);

		var classFunction = function(){
			var $this = {};

			for(var k in publicMembers){
				var m = publicMembers[k];
				if(getType(m) == 'Function'){
					this[k] = $this[k] = (function(m,$this){
						return function(){
							return m.apply($this , arguments);
						}
					})(m , $this);
				}else{
					this[k] = $this[k] = m;
				}
			}

			for(var k in privateMembers){
				var m = privateMembers[k];
				if(getType(m) == 'Function'){
					$this[k] = (function(m,$this){
						return function(){
							return m.apply($this , arguments);
						}
					})(m , $this);
				}else{
					$this[k] = m;
				}
			}

			var parentDefs = getParentsDefs(classDef) , parents = {};
			for(var i=0 ; i<parentDefs.length ; i++){
				var pdef = parentDefs[i];
				parents[pdef.name] = (function(m,$this){
					return function(){
						m.apply($this , arguments);
					}
				})(pdef.constructor , $this);
			}
			$this.parents = parents;
			
			classDef.constructor.apply($this , arguments);
		};

		window[classDef.name] = classFunction;
		return classFunction;
	}
})();
