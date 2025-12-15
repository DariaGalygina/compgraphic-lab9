class Point3D {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }
    
    subtract(other) {
        return new Point3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    add(other) {
        return new Point3D(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    cross(other) {
        return new Point3D(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        return len > 0 ? new Point3D(this.x/len, this.y/len, this.z/len) : this;
    }
    
    multiply(scalar) {
        return new Point3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }
}

class Vertex {
    constructor(position) {
        this.position = position;
        this.normal = new Point3D(0, 0, 0);
    }
}

class Face {
    constructor(vertexIndices, texCoords) {
        this.vertexIndices = vertexIndices;
        this.texCoords = texCoords;
    }
}

class Model3D {
    constructor(vertices, faces) {
        this.vertices = vertices;
        this.faces = faces.map(f => new Face(f.indices, f.texCoords || []));
        this.calculateNormals();
    }
    
    calculateNormals() {
        this.vertices.forEach(v => v.normal = new Point3D(0, 0, 0));
        this.faces.forEach(face => {
            if (face.vertexIndices.length < 3) return;

            const v0 = this.vertices[face.vertexIndices[0]].position;
            const v1 = this.vertices[face.vertexIndices[1]].position;
            const v2 = this.vertices[face.vertexIndices[2]].position;
            
            const normal = v1.subtract(v0).cross(v2.subtract(v0)).normalize();
            
            face.vertexIndices.forEach(idx => {
                this.vertices[idx].normal = this.vertices[idx].normal.add(normal);
            });
        });
        
        this.vertices.forEach(v => v.normal = v.normal.normalize());
    }
}

class Lighting3DViewer {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentModel = 'cube';
        this.shadingMode = 'phong';
        this.enableTexturing = false;
        this.lightPosition = new Point3D(2, 2, 2);
        this.objectColor = { r: 0.8, g: 0.6, b: 0.4 };
        
        this.ambient = 0.1;
        this.specularColor = { r: 1.0, g: 1.0, b: 1.0 };
        this.specularIntensity = 0.8;
        this.shininess = 32;

        this.enableToonShading = false;
        this.toonBands = 4;
        
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = 1.0;
        this.translation = { x: 0, y: 0, z: 0 };
        
        this.cameraDistance = 5;
        this.perspective = 500;
        
        this.textureImage = null;
        this.textureCanvas = document.createElement('canvas');
        this.textureCtx = this.textureCanvas.getContext('2d');
        
        this.models = this.createModels();
        this.setupEventListeners();
        this.render();
    }
    
    createModels() {
        const cubeVertices = [
            new Vertex(new Point3D(-1, -1, -1)),
            new Vertex(new Point3D(1, -1, -1)),
            new Vertex(new Point3D(1, 1, -1)),
            new Vertex(new Point3D(-1, 1, -1)),
            new Vertex(new Point3D(-1, -1, 1)),
            new Vertex(new Point3D(1, -1, 1)),
            new Vertex(new Point3D(1, 1, 1)),
            new Vertex(new Point3D(-1, 1, 1))
        ];
        
        const cubeFaces = [
            { indices: [0, 3, 2, 1], texCoords: [{ u: 0, v: 1 }, { u: 0, v: 0 }, { u: 1, v: 0 }, { u: 1, v: 1 }] },
            { indices: [4, 5, 6, 7], texCoords: [{ u: 0, v: 1 }, { u: 1, v: 1 }, { u: 1, v: 0 }, { u: 0, v: 0 }] },
            { indices: [0, 1, 5, 4], texCoords: [{ u: 0, v: 1 }, { u: 1, v: 1 }, { u: 1, v: 0 }, { u: 0, v: 0 }] },
            { indices: [2, 3, 7, 6], texCoords: [{ u: 1, v: 1 }, { u: 0, v: 1 }, { u: 0, v: 0 }, { u: 1, v: 0 }] },
            { indices: [0, 4, 7, 3], texCoords: [{ u: 0, v: 1 }, { u: 1, v: 1 }, { u: 1, v: 0 }, { u: 0, v: 0 }] },
            { indices: [1, 2, 6, 5], texCoords: [{ u: 0, v: 1 }, { u: 1, v: 1 }, { u: 1, v: 0 }, { u: 0, v: 0 }] }
        ];
        
        const tetraVertices = [
            new Vertex(new Point3D(0, 1, 0)),
            new Vertex(new Point3D(0.87, -0.5, 0)),
            new Vertex(new Point3D(-0.87, -0.5, 0)),
            new Vertex(new Point3D(0, 0, 1.41))
        ];
        
        const tetraFaces = [
            { indices: [0, 2, 1], texCoords: [{ u: 0.5, v: 0 }, { u: 0, v: 1 }, { u: 1, v: 1 }] },
            { indices: [0, 1, 3], texCoords: [{ u: 0.5, v: 0 }, { u: 0, v: 1 }, { u: 1, v: 1 }] },
            { indices: [0, 3, 2], texCoords: [{ u: 0.5, v: 0 }, { u: 1, v: 1 }, { u: 0, v: 1 }] },
            { indices: [1, 2, 3], texCoords: [{ u: 0, v: 0 }, { u: 1, v: 0 }, { u: 0.5, v: 1 }] }
        ];
        
        const octaVertices = [
            new Vertex(new Point3D(0, 1, 0)),
            new Vertex(new Point3D(1, 0, 0)),
            new Vertex(new Point3D(0, 0, 1)),
            new Vertex(new Point3D(-1, 0, 0)),
            new Vertex(new Point3D(0, 0, -1)),
            new Vertex(new Point3D(0, -1, 0))
        ];
        
        const octaFaces = [
            { indices: [0, 1, 2], texCoords: [{ u: 0.5, v: 0 }, { u: 1, v: 0.5 }, { u: 0.5, v: 1 }] },
            { indices: [0, 2, 3], texCoords: [{ u: 0.5, v: 0 }, { u: 0.5, v: 1 }, { u: 0, v: 0.5 }] },
            { indices: [0, 3, 4], texCoords: [{ u: 0.5, v: 0 }, { u: 0, v: 0.5 }, { u: 0.5, v: 1 }] },
            { indices: [0, 4, 1], texCoords: [{ u: 0.5, v: 0 }, { u: 0.5, v: 1 }, { u: 1, v: 0.5 }] },
            { indices: [5, 2, 1], texCoords: [{ u: 0.5, v: 1 }, { u: 0.5, v: 0 }, { u: 1, v: 0.5 }] },
            { indices: [5, 3, 2], texCoords: [{ u: 0.5, v: 1 }, { u: 0, v: 0.5 }, { u: 0.5, v: 0 }] },
            { indices: [5, 4, 3], texCoords: [{ u: 0.5, v: 1 }, { u: 0.5, v: 0 }, { u: 0, v: 0.5 }] },
            { indices: [5, 1, 4], texCoords: [{ u: 0.5, v: 1 }, { u: 1, v: 0.5 }, { u: 0.5, v: 0 }] }
        ];
        
        return {
            cube: new Model3D(cubeVertices, cubeFaces),
            tetrahedron: new Model3D(tetraVertices, tetraFaces),
            octahedron: new Model3D(octaVertices, octaFaces)
        };
    }
    
    setupEventListeners() {
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });
        document.getElementById('shadingMode').addEventListener('change', (e) => {
            this.shadingMode = e.target.value;
        });
        
        document.getElementById('textureFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.textureImage = new Image();
                    this.textureImage.onload = () => {
                        this.textureCanvas.width = this.textureImage.width;
                        this.textureCanvas.height = this.textureImage.height;
                        this.textureCtx.drawImage(this.textureImage, 0, 0);
                        document.getElementById('fileStatus').textContent = 'Texture loaded: ' + 
                            this.textureImage.width + 'x' + this.textureImage.height;
                        this.enableTexturing = true;
                    };
                    this.textureImage.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        ['lightX', 'lightY', 'lightZ'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.lightPosition[id.replace('light', '').toLowerCase()] = parseFloat(e.target.value);
                    const valueElement = document.getElementById(id + 'Value');
                    if (valueElement) {
                        valueElement.textContent = e.target.value;
                    }
                });
            }
        });
        
        ['rotateX', 'rotateY', 'rotateZ'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.rotation[id.replace('rotate', '').toLowerCase()] = parseFloat(e.target.value) * Math.PI / 180;
                    const valueElement = document.getElementById(id + 'Value');
                    if (valueElement) {
                        valueElement.textContent = e.target.value + '°';
                    }
                });
            }
        });
        
        const scaleElement = document.getElementById('scale');
        if (scaleElement) {
            scaleElement.addEventListener('input', (e) => {
                this.scale = parseFloat(e.target.value);
                const valueElement = document.getElementById('scaleValue');
                if (valueElement) {
                    valueElement.textContent = e.target.value;
                }
            });
        }
        
        ['translateX', 'translateY', 'translateZ'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.translation[id.replace('translate', '').toLowerCase()] = parseFloat(e.target.value);
                    const valueElement = document.getElementById(id + 'Value');
                    if (valueElement) {
                        valueElement.textContent = e.target.value;
                    }
                    
                    const model = this.models[this.currentModel];
                    const faceCountElement = document.getElementById('faceCount');
                    const vertexCountElement = document.getElementById('vertexCount');
                    if (faceCountElement) faceCountElement.textContent = model.faces.length;
                    if (vertexCountElement) vertexCountElement.textContent = model.vertices.length;
                });
            }
        });

        const toonToggle = document.getElementById('toonToggle');
        if (toonToggle) {
            toonToggle.addEventListener('change', (e) => {
                this.enableToonShading = e.target.checked;
            });
        }

        const toonBands = document.getElementById('toonBands');
        const toonBandsValue = document.getElementById('toonBandsValue');
        if (toonBands && toonBandsValue) {
            toonBands.addEventListener('input', (e) => {
                this.toonBands = parseInt(e.target.value);
                toonBandsValue.textContent = e.target.value;
            });
        }
    }
    
    rotatePoint(point, rx, ry, rz) {
        let x = point.x, y = point.y, z = point.z;
        if (rx !== 0) {
            const cosX = Math.cos(rx), sinX = Math.sin(rx);
            [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
        }
        if (ry !== 0) {
            const cosY = Math.cos(ry), sinY = Math.sin(ry);
            [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];
        }
        if (rz !== 0) {
            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
            [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];
        }
        return new Point3D(x, y, z);
    }
    
    calculatePhong(normal, viewDirection) {
        const normNormal = normal.normalize();
        const lightDir = this.lightPosition.normalize();
        const viewDir = viewDirection.normalize();
        
        let diffuse = Math.max(normNormal.dot(lightDir), 0);
        let specular = 0;
        
        if (this.enableToonShading && this.toonBands > 1) {
            const bands = this.toonBands;
            diffuse = Math.floor(diffuse * (bands - 1)) / (bands - 1);
        }

        if (diffuse > 0) {
            const reflectDir = normNormal.multiply(2 * normNormal.dot(lightDir)).subtract(lightDir).normalize();
            
            const specAngle = Math.max(reflectDir.dot(viewDir), 0);
            
            specular = this.specularIntensity * Math.pow(specAngle, this.shininess);

            if (this.enableToonShading) {
                specular = (specular > 0.5) ? this.specularIntensity : 0;
            }
        }
        
        return {
            ambient: this.ambient,
            diffuse: diffuse,
            specular: specular
        };
    }
    
    getTextureColor(u, v) {
        if (this.textureImage) {
            const x = Math.round(u * (this.textureCanvas.width - 1));
            const y = Math.round(v * (this.textureCanvas.height - 1));
            
            const imageData = this.textureCtx.getImageData(x, y, 1, 1);
            const data = imageData.data;
            
            return {
                r: data[0] / 255,
                g: data[1] / 255,
                b: data[2] / 255
            };
        }
        
        const size = 8;
        const tileU = Math.floor(u * size);
        const tileV = Math.floor(v * size);
        return (tileU % 2 === tileV % 2) ? 
            { r: 1, g: 1, b: 1 } : { r: 0.3, g: 0.3, b: 0.3 };
    }
    
    drawTriangle(v1, v2, v3, screenV1, screenV2, screenV3, texCoord1, texCoord2, texCoord3) {
        const minX = Math.max(0, Math.floor(Math.min(screenV1.x, screenV2.x, screenV3.x)));
        const maxX = Math.min(this.canvas.width - 1, Math.ceil(Math.max(screenV1.x, screenV2.x, screenV3.x)));
        const minY = Math.max(0, Math.floor(Math.min(screenV1.y, screenV2.y, screenV3.y)));
        const maxY = Math.min(this.canvas.height - 1, Math.ceil(Math.max(screenV1.y, screenV2.y, screenV3.y)));
        
        const cameraPos = new Point3D(0, 0, this.cameraDistance);
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const denom = (screenV2.y - screenV3.y) * (screenV1.x - screenV3.x) + 
                             (screenV3.x - screenV2.x) * (screenV1.y - screenV3.y);
                if (Math.abs(denom) < 0.0001) continue;
                
                const lambda1 = ((screenV2.y - screenV3.y) * (x - screenV3.x) + 
                                 (screenV3.x - screenV2.x) * (y - screenV3.y)) / denom;
                const lambda2 = ((screenV3.y - screenV1.y) * (x - screenV3.x) + 
                                 (screenV1.x - screenV3.x) * (y - screenV3.y)) / denom;
                const lambda3 = 1 - lambda1 - lambda2;
                
                if (lambda1 >= -0.001 && lambda2 >= -0.001 && lambda3 >= -0.001) {
                    let color;
                    
                    if (this.shadingMode === 'gouraud') {
                        const r = lambda1 * v1.color.r + lambda2 * v2.color.r + lambda3 * v3.color.r;
                        const g = lambda1 * v1.color.g + lambda2 * v2.color.g + lambda3 * v3.color.g;
                        const b = lambda1 * v1.color.b + lambda2 * v2.color.b + lambda3 * v3.color.b;
                        color = { r, g, b };
                    } else {
                        const interpolatedNormal = new Point3D(
                            lambda1 * v1.normal.x + lambda2 * v2.normal.x + lambda3 * v3.normal.x,
                            lambda1 * v1.normal.y + lambda2 * v2.normal.y + lambda3 * v3.normal.y,
                            lambda1 * v1.normal.z + lambda2 * v2.normal.z + lambda3 * v3.normal.z
                        ).normalize();
                        
                        const position = new Point3D(
                            lambda1 * v1.position.x + lambda2 * v2.position.x + lambda3 * v3.position.x,
                            lambda1 * v1.position.y + lambda2 * v2.position.y + lambda3 * v3.position.y,
                            lambda1 * v1.position.z + lambda2 * v2.position.z + lambda3 * v3.position.z
                        );
                        
                        const viewDir = cameraPos.subtract(position);
                        const phong = this.calculatePhong(interpolatedNormal, viewDir);
                        
                        color = {
                            r: phong.ambient * this.objectColor.r + 
                                phong.diffuse * this.objectColor.r + 
                                phong.specular * this.specularColor.r,
                            g: phong.ambient * this.objectColor.g + 
                                phong.diffuse * this.objectColor.g + 
                                phong.specular * this.specularColor.g,
                            b: phong.ambient * this.objectColor.b + 
                                phong.diffuse * this.objectColor.b + 
                                phong.specular * this.specularColor.b
                        };
                    }
                    
                    if (this.enableTexturing) {
                        const u = lambda1 * texCoord1.u + lambda2 * texCoord2.u + lambda3 * texCoord3.u;
                        const v = lambda1 * texCoord1.v + lambda2 * texCoord2.v + lambda3 * texCoord3.v;
                        const texColor = this.getTextureColor(u, v);
                        
                        color.r *= texColor.r; 
                        color.g *= texColor.g; 
                        color.b *= texColor.b;
                    }
                    
                    color.r = Math.min(Math.max(color.r, 0), 1);
                    color.g = Math.min(Math.max(color.g, 0), 1);
                    color.b = Math.min(Math.max(color.b, 0), 1);
                    
                    this.ctx.fillStyle = `rgb(${Math.floor(color.r * 255)},${Math.floor(color.g * 255)},${Math.floor(color.b * 255)})`;
                    this.ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const model = this.models[this.currentModel];
        
        const faceCountElement = document.getElementById('faceCount');
        const vertexCountElement = document.getElementById('vertexCount');
        if (faceCountElement) faceCountElement.textContent = model.faces.length;
        if (vertexCountElement) vertexCountElement.textContent = model.vertices.length;
        
        const transformedVertices = model.vertices.map((vertex) => {
            const scaled = vertex.position.multiply(this.scale);
            const rotated = this.rotatePoint(scaled, this.rotation.x, this.rotation.y, this.rotation.z);
            const translated = new Point3D(
                rotated.x + this.translation.x,
                rotated.y + this.translation.y,
                rotated.z + this.translation.z
            );
            
            const rotatedNormal = this.rotatePoint(vertex.normal, this.rotation.x, this.rotation.y, this.rotation.z);
            
            return {
                position: translated,
                normal: rotatedNormal
            };
        });
        
        const screenVertices = transformedVertices.map(vertex => {
            const cameraZ = this.cameraDistance;
            const objectZ = vertex.position.z;
            const zDistance = cameraZ - objectZ; 
            
            const factor = this.perspective / (this.perspective + zDistance);
            const scaleFactor = 120; 
            
            return {
                x: vertex.position.x * factor * scaleFactor + this.canvas.width / 2,
                y: -vertex.position.y * factor * scaleFactor + this.canvas.height / 2,
                z: zDistance
            };
        });
        
        const vertexColors = this.shadingMode === 'gouraud' ? 
            transformedVertices.map((vertex) => {
                const normNormal = vertex.normal.normalize();
                const lightDir = this.lightPosition.normalize();
                
                let diffuse = Math.max(normNormal.dot(lightDir), 0);
                
                return {
                    r: this.ambient * this.objectColor.r + diffuse * this.objectColor.r,
                    g: this.ambient * this.objectColor.g + diffuse * this.objectColor.g,
                    b: this.ambient * this.objectColor.b + diffuse * this.objectColor.b
                };
            }) : null;
        
        const sortedFaces = model.faces.map(face => {
            const zAvg = face.vertexIndices.reduce((sum, idx) => sum + screenVertices[idx].z, 0) / face.vertexIndices.length;
            return { face, zAvg };
        }).sort((a, b) => b.zAvg - a.zAvg);

        sortedFaces.forEach(item => {
            const face = item.face;
            
            if (face.vertexIndices.length >= 3) {
                const pos1 = transformedVertices[face.vertexIndices[0]].position;
                const pos2 = transformedVertices[face.vertexIndices[1]].position;
                const pos3 = transformedVertices[face.vertexIndices[2]].position;
                
                const edge1 = pos2.subtract(pos1);
                const edge2 = pos3.subtract(pos1);
                const normal = edge1.cross(edge2);
                
                const cameraPos = new Point3D(0, 0, this.cameraDistance);
                const toCamera = cameraPos.subtract(pos1);
                
                if (normal.dot(toCamera) > 0) {
                    if (face.vertexIndices.length === 3) {
                        this._renderTriangle(face.vertexIndices[0], face.vertexIndices[1], face.vertexIndices[2], face.texCoords[0], face.texCoords[1], face.texCoords[2], transformedVertices, screenVertices, vertexColors);
                    } else if (face.vertexIndices.length === 4) {
                        this._renderTriangle(face.vertexIndices[0], face.vertexIndices[1], face.vertexIndices[2], face.texCoords[0], face.texCoords[1], face.texCoords[2], transformedVertices, screenVertices, vertexColors);
                        this._renderTriangle(face.vertexIndices[0], face.vertexIndices[2], face.vertexIndices[3], face.texCoords[0], face.texCoords[2], face.texCoords[3], transformedVertices, screenVertices, vertexColors);
                    }
                }
            }
        });
        
        requestAnimationFrame(() => this.render());
    }

    _renderTriangle(i1, i2, i3, tc1, tc2, tc3, transformedVertices, screenVertices, vertexColors) {
        const v1 = {
            ...transformedVertices[i1],
            color: this.shadingMode === 'gouraud' ? vertexColors[i1] : null
        };
        const v2 = {
            ...transformedVertices[i2],
            color: this.shadingMode === 'gouraud' ? vertexColors[i2] : null
        };
        const v3 = {
            ...transformedVertices[i3],
            color: this.shadingMode === 'gouraud' ? vertexColors[i3] : null
        };
        
        this.drawTriangle(
            v1, v2, v3,
            screenVertices[i1],
            screenVertices[i2],
            screenVertices[i3],
            tc1, tc2, tc3
        );
    }
}

window.addEventListener('load', () => {
    new Lighting3DViewer();
});
