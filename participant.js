'use strict'
let _right = 1;
let _team;
let _settings;
let _opponents;
let _tick = 0;
let _responses = {
	FORWARD: 'y+',
	BACKWARDS: 'y-',
	UP: 'z+',
	DOWN: 'z-',
	LEFT: 'x-',
	RIGHT: 'x+'
}
let _currentDirection = _responses.FORWARD;
let _target = null;
function isSpaceOpen(data, x, y, z){
	let layer = data[z];
	if(layer){
		let column = layer[x];
		if(column){
			let space = column[y];
			if(space){
				return space.occupiedBy === null || space.occupiedBy.isLastTrailingBody;
			}
		}
	}
	return false;
}
function getPos(data){
	for(const z in data){
		const height = data[z];
		for(const x in height){
			const column = height[x];
			for(const y in column){
				const space = column[y];
				if(space.occupiedBy && space.occupiedBy.team === _team && space.occupiedBy.type === 'SolidWorm'){
					return {x: parseInt(x), y: parseInt(y), z: parseInt(z)};
				}
			}
		}
	}
}
function getPossibleResponses(data, pos){
	let possibleResponses = [];
	if(_currentDirection !== _responses.BACKWARDS && isSpaceOpen(data, pos.x, pos.y+1, pos.z)){
		possibleResponses.push(_responses.FORWARD);
	}
	if(_currentDirection !== _responses.FORWARD && isSpaceOpen(data, pos.x, pos.y-1, pos.z)){
		possibleResponses.push(_responses.BACKWARDS);
	}
	if(_currentDirection !== _responses.LEFT && isSpaceOpen(data, pos.x+1, pos.y, pos.z)){
		possibleResponses.push(_responses.RIGHT);
	}
	if(_currentDirection !== _responses.RIGHT && isSpaceOpen(data, pos.x-1, pos.y, pos.z)){
		possibleResponses.push(_responses.LEFT);
	}
	if(_currentDirection !== _responses.DOWN && isSpaceOpen(data, pos.x, pos.y, pos.z+1)){
		possibleResponses.push(_responses.UP);
	}
	if(_currentDirection !== _responses.UP && isSpaceOpen(data, pos.x, pos.y, pos.z-1)){
		possibleResponses.push(_responses.DOWN);
	}
	return possibleResponses;
}
onmessage = init => {
	_settings = init.settings;
	_opponents = init.opponents;
	_team = _opponents.findIndex(opponent=>opponent===null);
	onmessage = message => {
		console.log("message!")
		if(message.type !== 'Post'){
			return;
		}
		let data = message.data;
		let pos = getPos(data);
		if(!pos){
			throw new Error('Position not found.');
		}
		if(!_target || !data[_target.pos_z][_target.pos_x][_target.pos_y].eatables.apple){
			let eatables = [];
			data.forEach((height, z) => {
				height.forEach((column, x) => {
					column.forEach((space, y) => {
						if(space.eatables.apple || 0 < space.eatables.other){
							let e = {distance: Math.abs(pos.x-x)+Math.abs(pos.y-y)+Math.abs(pos.z-z), eatables: space.eatables.other, pos_z: z, pos_x: x, pos_y: y};
							if(space.eatables.apple){
								e.eatables++;
							}
							eatables.push(e);
						}
					});
				});
			});
			_target = eatables[Math.floor(Math.random()*eatables.length)];
		}
		let dirOptions = [];
		if(_target){
			let dx = _target.pos_x-pos.x;
			let dy = _target.pos_y-pos.y;
			let dz = _target.pos_z-pos.z;
			dirOptions.push({dir: _responses.FORWARD, nextDistance: Math.abs(dx)+Math.abs(dy-1)+Math.abs(dz)});
			dirOptions.push({dir: _responses.BACKWARDS, nextDistance: Math.abs(dx)+Math.abs(dy+1)+Math.abs(dz)});
			dirOptions.push({dir: _responses.RIGHT, nextDistance: Math.abs(dx-1)+Math.abs(dy)+Math.abs(dz)});
			dirOptions.push({dir: _responses.LEFT, nextDistance: Math.abs(dx+1)+Math.abs(dy)+Math.abs(dz)});
			dirOptions.push({dir: _responses.UP, nextDistance: Math.abs(dx)+Math.abs(dy)+Math.abs(dz-1)});
			dirOptions.push({dir: _responses.DOWN, nextDistance: Math.abs(dx)+Math.abs(dy)+Math.abs(dz+1)});
			dirOptions.forEach(option => option.sort = option.nextDistance + Math.random()); // Shuffle equal distance.
			let possibleResponses = getPossibleResponses(data, pos);
			for(const option of dirOptions.sort((o1, o2) => o1.sort - o2.sort)){
				if(possibleResponses.includes(option.dir)){
					_currentDirection = option.dir;
					break
				}
			}
		}
		postMessage(_currentDirection);
		_tick++;
	}
}
