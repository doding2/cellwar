// 암세포 상태 (성장중, 싸우는중, 죽음)
const GROWING = 0;
const FIGHTING = 1;
const DEAD = 2;

var canvas;
var renderer;
var scene;
var camera;
var loader;

var cancerIndex = 0;	// 암세포들의 총 개수(이미 죽은 암세포도 포함)
var cancerList = [];	// 암세포 변수들을 담아놓는 리스트

// 적혈구(먹이)의 총 개수, 적혈구들을 담아놓는 리스트
var bloodCellIndex = 0;
var bloodCellList = [];

window.onload = function init()
{
	canvas = document.getElementById( "gl-canvas" );
	canvas.width = window.innerWidth; 
	canvas.height = window.innerHeight;

	renderer = new THREE.WebGLRenderer({canvas});
	renderer.setSize(canvas.width,canvas.height);

	scene = new THREE.Scene();
    scene.background = new THREE.Color('#AC1822');  // 배경색

	camera = new THREE.PerspectiveCamera(75,canvas.width / canvas.height,0.1, 1000);
	camera.rotation.y = 45/180*Math.PI;
	camera.position.x = 130;
	camera.position.y = 100;
	camera.position.z = 130;

	const controls = new THREE.OrbitControls(camera, renderer.domElement);

	light = new THREE.PointLight(0xA9A9A9,10);
	light.position.set(0,3000,5000);
	scene.add(light);

	light2 = new THREE.PointLight(0xA9A9A9,10);
	light2.position.set(5000,1000,0);
	scene.add(light2);

	light3 = new THREE.PointLight(0xA9A9A9,10);
	light3.position.set(0,1000,-5000);
	scene.add(light3);

	light4 = new THREE.PointLight(0xA9A9A9,10);
	light4.position.set(-5000,3000,5000);
	scene.add(light4);

	loader = new THREE.GLTFLoader();

	// gltf 모델링 불러와서 엄마 암세포(적) 만들기
	loadRootCancer();

	// gltf 모델링 불러와서 면역세포(유저) 만들기
    loadImmuneCell();

	// gltf 모델링 불러와서 적혈구(먹이) 만들기
	loadBloodCell();
	
	// 매 초마다 특정 함수들 실행
	setInterval(updateCancersState, 1000);	// 1초마다 포인트, 상태 업데이트
	setInterval(changeCancersDirection, 500);	// 0.5초마다 암세포 이동 방향 조정
	setInterval(increaseCancersScale, 100);	// 0.1초마다 크기 증가
	setInterval(moveCancers, 100);	// 0.1초마다 암세포 이동

	animate();
}

// rendering
function animate() {
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
 }



/**** 면역세포 ****/
// gltf 파일에서 모델링 불러와서 면역세포(user)를 만드는 함수
function loadImmuneCell() {

   loader.load('./lympocyte/scene.gltf', function(gltf){
       var cell = gltf.scene.children[0];
       cell.scale.set(5, 5, 5);
       cell.position.set(0, 0, 0);    // 물체 위치
       scene.add(gltf.scene);

   }, undefined, function (error) {
       console.error(error);
   });

}



/**** 암세포 ****/
 // gltf 파일에서 모델링 불러와서 맨 처음 모든 암세포의 엄마가 되는 root cancer 만드는 함수
 function loadRootCancer() {

	loader.load('./cancer_model/scene.gltf', function(gltf){
		var cancer = gltf.scene.children[0];
		cancer.index = cancerIndex;
		cancer.point = 0;
		cancer.scale.set(5, 5, 5);
		cancer.state = GROWING;

		var offset = getRandomOffset();
		cancer.position.set(-60, 60, 60);
		cancer.direction = offset;

		scene.add(cancer);
		cancerList[cancerIndex] = cancer;					// 각 cancer들에 접근하기 위해 리스트에 따로 저장
		console.log("Mom " + cancerIndex + " is created [" + cancer.direction + "]")
		cancerIndex++;

	  }, undefined, function (error) {
		  console.error(error);
	  });
}

// 암세포가 움직일 방향 또는 엄마 암세포로부터 떨어진 초기 위치(offset)를 생성해서 리턴해주는 함수
function getRandomOffset() {
	var offset = [];

	// 총 27가지의 경우의 수
	for (var i = 0; i < 3; i++) {
		// 범위가 0 ~ 2인 난수 생성
		var randomValue = Math.floor(Math.random() * 3);

		// 0, 40, -40 중 하나를 offset에 push
		if (randomValue === 0)
			offset.push(0);
		else if (randomValue === 1) 
			offset.push(40);
		else
			offset.push(-40);
	}

	return offset;
}

 // 엄마 암세포로부터 자식 암세포 생성하는 함수
 function createBabyCancer(momIndex, offset) {

	// 엄마 암세포 있나 없나 체크
	var momCancer = cancerList[momIndex]
	if (!momCancer) 
		return;

	var babyCancer = momCancer.clone();

	babyCancer.index = cancerIndex;
	babyCancer.point = 0;
	babyCancer.scale.set(5, 5, 5);
	babyCancer.state = GROWING;

	babyCancer.position.x = momCancer.position.x + offset[0];
	babyCancer.position.y = momCancer.position.y + offset[1];
	babyCancer.position.z = momCancer.position.z + offset[2];

	babyCancer.direction = offset;

	scene.add(babyCancer);
	cancerList[cancerIndex] = babyCancer;			// 각 cancer들에 접근하기 위해 리스트에 따로 저장
	console.log(cancerIndex++ + " is created [" + babyCancer.direction + "]")
}

// index값에 해당하는 cancer를 scene에서 제거하는 함수
function removeCancer(i) {

	// 해당 index에 아무것도 없다면 함수 종료
	var cancer = cancerList[i];
	if (!cancer)
		return;
		
    scene.remove(cancer);					// scene에서 제거, 더이상 렌더링 되지 않음
	cancerList[i] = undefined;
	console.log(cancer.index + " is killed");
}

// 암세포들의 상태, 포인트를 업데이트해줌. 포인트가 일정 수준에 다다르면 분열
function updateCancersState() {
	for (var i = 0; i < cancerIndex; i++) {

		// 해당 index에 아무것도 없다면 이번 루프 패스
		var cancer = cancerList[i];
		if (!cancer)
			continue;

		// 암세포 포인트 업데이트
		if (cancer.state === GROWING) {
			cancer.point += 1;
		}

		// 엄마 암세포의 포인트가 10이 되고 이미 죽은 상태가 아니라면, 애기 암세포 3개 생성 후 제거
		if (cancer.state !== DEAD && cancer.point === 10) {

			cancer.state = DEAD;

			// 암세포 초기 위치, 방향 값 랜덤 생성
			var offset1 = getRandomOffset();
			var offset2 = getRandomOffset();
			var offset3 = getRandomOffset();

			// 암세포끼리 겹치는것 방지
			while (offset1 === offset2) {
				offset2 = getRandomOffset();
			}
			while (offset1 === offset3 || offset2 === offset3) {
				offset3 = getRandomOffset();
			}

			createBabyCancer(i, offset1);
			createBabyCancer(i, offset2);
			createBabyCancer(i, offset3);

			removeCancer(i);
		}
	}
}

// 암세포들의 크기를 증가시키는 함수
function increaseCancersScale() {
	for (var i = 0; i < cancerIndex; i++) {

		// 해당 index에 아무것도 없다면 이번 루프 패스
		if (!cancerList[i])
			continue;

		// 암세포 상태 업데이트
		var cancer = cancerList[i];
		if (cancer.state === GROWING) {
			cancer.scale.set(cancer.scale.x + 0.1, cancer.scale.y + 0.1, cancer.scale.z + 0.1);
		}
	}
}

// 암세포들을 자동으로 움직이게 하는 함수
function moveCancers() {
	for (var i = 0; i < cancerIndex; i++) {

		// 해당 index에 아무것도 없다면 이번 루프 패스
		var cancer = cancerList[i];
		if (!cancer)
			continue;

		// 암세포 위치 이동
		if (cancer.state === GROWING) {
			cancer.position.x += cancer.direction[0] / 40;
			cancer.position.y += cancer.direction[1] / 40;
			cancer.position.z += cancer.direction[2] / 40;
		}
	}
}

// 암세포들이 움직이는 방향을 주기적으로 조정해주는 함수
function changeCancersDirection() {
	for (var i = 0; i < cancerIndex; i++) {

		// 해당 index에 아무것도 없다면 이번 루프 패스
		var cancer = cancerList[i];
		if (!cancer)
			continue;

		// 암세포 이동 방향 조정
		if (cancer.state === GROWING) {
			cancer.direction[0] += cancer.direction[1] / 10;
			cancer.direction[1] += cancer.direction[2] / 10;
			cancer.direction[2] += cancer.direction[0] / 10;
		}
	}
}

// 암세포들간의 충돌 탐지
function detectCancersCollision() {
	for (var i = 0; i < cancerIndex; i++) {

		// 해당 index에 아무것도 없다면 이번 루프 패스
		var cancer = cancerList[i];
		if (!cancer)
			continue;

		// 암세포 충돌 확인
		if (cancer.state === GROWING) {
			// cancer의 현재 좌표
			var cp = [cancer.position.x, cancer.position.y, cancer.position.z];

			// cancer의 반지름
			var box = new THREE.Box3().setFromObject( cancer );
			var cancer_radius = Math.floor(Math.abs(box.max.x - box.min.x)) / 2;

			for (var j = i + 1; j < cancerIndex; j++) {
				var next_cancer = cancerList[j];
				if (!next_cancer)
					continue;

				// next_cancer의 현재 좌표
				var np = [next_cancer.position.x, next_cancer.position.y, next_cancer.position.z];
				// next_cancer의 반지름
				var next_box = new THREE.Box3().setFromObject( cancer );
				var next_cancer_radius = Math.floor(Math.abs(next_box.max.x - next_box.min.x)) / 2;

				// cancer와 next_cancer간의 거리
				var distance = Math.floor(Math.sqrt(Math.pow(np[0] - cp[0], 2) + Math.pow(np[1] - cp[1], 2) + Math.pow(np[2] - cp[2], 2)));
				
				// 충돌이 발생한 경우 암세포의 진행 방향 전환 (서로 부딪쳐서 팅겨나가는 것 처럼 보이게)
				if (distance <= cancer_radius + next_cancer_radius) {





					// 충돌 발생시 어떻게 할 것인지 여기다 적으면 됨





					console.log("암세포간 거리:" + distance + "\n암세포1 반지름:" + cancer_radius + "\n암세포2 반지름:" + next_cancer_radius);
					console.log("암세포간 충돌 발생!\n\n");
				}
			}
		}
	}
}



/**** 적혈구(먹이) ***/
// gltf 파일에서 적혈구 모델링을 불러오는 함수
function loadBloodCell() {
	loader.load('./blood_cell_model/scene.gltf', function(gltf){
		var cell = gltf.scene.children[0];
		cell.index = bloodCellIndex;
		cell.point = 10;
		cell.scale.set(3, 3, 3);
		cell.position.set(-50, 50, 50);

		scene.add(cell);
		bloodCellList[bloodCellIndex] = cell;
		bloodCellIndex++;

		copyAndSpreadBloodCells();

	  }, undefined, function (error) {
		  console.error(error);
	  });
}

// 적혈구 100개를 복사해서 랜덤한 곳에 뿌려주는 함수
function copyAndSpreadBloodCells() {
	var bloodCell = bloodCellList[0];
	if (!bloodCell)
		return;

	// 적혈구 100개 생성
	for (var i = 0; i < 100; i++) {
		var copiedBloodCell = bloodCell.clone();	// 복사
		copiedBloodCell.index = bloodCellIndex;
		copiedBloodCell.point = 10;
		copiedBloodCell.scale.set(3, 3, 3);
	
		// 좌표 랜덤 생성
		var rv1 = getRandomValue();
		var rv2 = getRandomValue();
		var rv3 = getRandomValue();
		copiedBloodCell.position.set(rv1, rv2, rv3);
		copiedBloodCell.rotation.set(rv1, rv2, rv3);
	
		scene.add(copiedBloodCell);
		bloodCellList[bloodCellIndex] = copiedBloodCell;
		bloodCellIndex++;
	}

}

// 범위가 -300 ~ 300인 난수를 생성하는 함수 (적혈구 좌표 랜덤 생성용)
function getRandomValue() {
	return Math.floor(Math.random() * 600 - 300);
}