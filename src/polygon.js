var mouseMoveCreatePolygon = (gl, index, position) => {
  gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, new Float32Array([position.x, position.y]));
}

var addPolygonPoint = (gl, position, index, default_color, positionBuffer) => {
  gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, new Float32Array(default_color));
  gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + 1), new Float32Array(default_color));

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + 1), new Float32Array([position.x, position.y]));

  if (!polygonPointsArray[shape_index]) {
    document.getElementById("polygon-save").hidden = false;
    polygonPointsArray[shape_index] = [];
  }

  polygonPointsArray[shape_index].push([position.x, position.y]);
}

var addPolygonHullPoint = (gl, position, index, default_color, positionBuffer) => {
  if (!polygonPointsArray[shape_index]) {
    document.getElementById("polygon-save").hidden = false;
    polygonPointsArray[shape_index] = [];
  }

  polygonPointsArray[shape_index].push([position.x, position.y]);
  indexHull++
  if (polygonPointsArray[shape_index].length >= 4) {
    polygonPointsArray[shape_index] = getPolygonHull(polygonPointsArray[shape_index]);
    indexHull = polygonPointsArray[shape_index].length;
  }

  for (let i = 0; i < indexHull; i++) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index + i), new Float32Array(default_color));
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  for (let i = 0; i < indexHull; i++) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + i), new Float32Array(polygonPointsArray[shape_index][i]));
  }
}

var deletePolygonVertex = (gl, positionBuffer, colorBuffer) => {
  const idx = selected_shape.shape_index;
  const verLength = polygonPointsArray[idx].length;
  
  if (verLength == 3) {
    alert("Tidak bisa menghapus titik karena hanya tersisa 3 titik");
    return;
  }
  for (let i = idx + 1; i < arrayOfShapes.length; i++) {
    arrayOfShapes[i].index -= 1;
  }
  
  delete arrayOfShapes[idx].vertices[clicked_vertex];
  delete arrayOfShapes[idx].colors[clicked_vertex];
  arrayOfShapes[idx].vertices = repack(arrayOfShapes[idx].vertices);
  arrayOfShapes[idx].colors = repack(arrayOfShapes[idx].colors);
  
  arrayOfShapes[idx].nPolygon--;
  index--;
  polygonPointsArray[idx].splice(clicked_vertex, 1);
  
  refreshCanvas(gl, positionBuffer, colorBuffer);
  console.log(arrayOfShapes);
}

var finalizePolygon = (gl, shape, positionBuffer) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const polArr = polygonPointsArray[shape_index];
  const idx = index - polArr.length;

  for (let i = 0; i < polArr.length; i++) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (idx + i), new Float32Array(polArr[i]));
  }

  const vertices = Object.assign({}, ...polArr.map((_, i) => ({ [i]: polArr[i] })));
  const colors = Object.assign({}, ...polArr.map((_, i) => ({ [i]: default_color })));
  const nPolygon = polArr.length;

  arrayOfShapes.push({
    shape,
    shape_index,
    vertices,
    colors,
    index: idx,
    nPolygon
  });
  rotationSpeeds.push(0);
}

var finalizePolygonHull = (shape) => {
  const polArr = polygonPointsArray[shape_index];
  const vertices = Object.assign({}, ...polArr.map((_, i) => ({ [i]: polArr[i] })));
  const colors = Object.assign({}, ...polArr.map((_, i) => ({ [i]: default_color })));
  const nPolygon = polArr.length;
  
  indexHull = 0;
  arrayOfShapes.push({
    shape,
    shape_index,
    vertices,
    colors,
    index,
    nPolygon
  });
  index += nPolygon;
  rotationSpeeds.push(0);
}

var changeColorVertexPolygon = (gl, selected_shape, rgb) => {
  gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (selected_shape.index + parseInt(clicked_vertex)), new Float32Array(rgb));

  arrayOfShapes[selected_shape.shape_index].colors[clicked_vertex] = rgb;
}

var movePolygonVertex = (gl, selected_shape, position) => {
  gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (selected_shape.index + parseInt(clicked_vertex)), new Float32Array([position.x, position.y]));

  polygonPointsArray[selected_shape.shape_index][parseInt(clicked_vertex)] = [position.x, position.y];
}

var movePolygon = (gl, selected_shape, position, mouseDownPosition) => {
  const idx = selected_shape.index;

  for (let i = 0; i < selected_shape.nPolygon; i++) {
    let diff = [position.x - mouseDownPosition.x, position.y - mouseDownPosition.y];
    let newPoint = [selected_shape.vertices[i][0] + diff[0], selected_shape.vertices[i][1] + diff[1]];
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (idx + i), new Float32Array(newPoint));
    polygonPointsArray[selected_shape.shape_index][i] = newPoint;
  }
}

var dilatePolygon = (gl, dilateValue) => {
  const idx = selected_shape.index;

  for (let i = 0; i < selected_shape.nPolygon; i++) {
    let newPoint = [selected_shape.vertices[i][0] * dilateValue, selected_shape.vertices[i][1] * dilateValue];
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (idx + i), new Float32Array(newPoint));
    polygonPointsArray[selected_shape.shape_index][i] = newPoint;
    arrayOfShapes[selected_shape.shape_index].vertices[i] = newPoint;
  }
}

var stopMovingPolygon = (selected_shape) => {
  for (let i = 0; i < selected_shape.nPolygon; i++) {
    arrayOfShapes[selected_shape.shape_index].vertices[i] = polygonPointsArray[selected_shape.shape_index][i];
  }
}

var calculatePolygonCenter = (shape) => {
  let x = 0;
  let y = 0;

  for (let i = 0; i < shape.nPolygon; i++) {
    x += shape.vertices[i][0];
    y += shape.vertices[i][1];
  }

  return [x / shape.nPolygon, y / shape.nPolygon];
}

var rotatePolygonAroundCenter = (gl, selected_shape, angle) => {
  const idx = selected_shape.index;
  let center = calculatePolygonCenter(selected_shape);
  for (let i = 0; i < selected_shape.nPolygon; i++) {
    let newPoint = rotatePointAroundCenter(selected_shape.vertices[i], center, angle);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (idx + i), new Float32Array(newPoint));
    polygonPointsArray[selected_shape.shape_index][i] = newPoint;
    arrayOfShapes[selected_shape.shape_index].vertices[i] = newPoint;
  }
}

var getPolygonHull = (cur_position) => {
  let hull = [];
  const n = cur_position.length;

  let l = 0;
  for (let i = 1; i < n; i++) {
    if (cur_position[i][0] < cur_position[l][0]) {
      l = i;
    }
  }

  let p = l, q;
  do {
    hull.push(cur_position[p]);
    q = (p + 1) % n;

    for (let i = 0; i < n; i++) {
      if (getOrientation(cur_position[p], cur_position[i], cur_position[q]) == 2) {
        q = i;
      }
    }

    p = q;
  } while (p != l);

  return hull;
}