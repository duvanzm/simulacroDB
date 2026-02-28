// Entidades Fuertes

CREATE TABLE cargos (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE autores (
    id_autor INT AUTO_INCLEMENT PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE editoriales (
    id_editorial INT AUTO_INCLEMENT PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(45) NOT NULL
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    telefono_cliente VARCHAR(20) NOT NULL,
    correo_cliente VARCHAR(100) NOT NULL UNIQUE
);

// Entidades Debiles

CREATE TABLE libros (
    id_libro INT AUTO_INCREMENT PRIMARY KEY,
    titulo_libro VARCHAR(100) NOT NULL,
    id_autor INT NOT NULL,
    id_categoria INT NOT NULL,
    id_editorial INT NOT NULL,
    anio_publicacion YEAR NOT NULL,
    precio_libro DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_autor) REFERENCES autores(id_autor),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (id_editorial) REFERENCES editoriales(id_editorial)
);


CREATE TABLE empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empleado VARCHAR(100) NOT NULL,
    id_cargo INT NOT NULL,
    FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo)
);

CREATE TABLE prestamos (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion DATE,
    id_cliente INT NOT NULL,
    id_empleado INT NOT NULL,
    id_libro INT NOT NULL,

    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado),
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro)
);
