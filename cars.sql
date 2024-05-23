CREATE DATABASE cars; 
USE cars; 

CREATE TABLE cars(
	id INT(10) AUTO_INCREMENT NOT NULL, 
    make VARCHAR(45), 
    model VARCHAR(45), 
    year INT(4),
    deleted_flag TINYINT(1),
    PRIMARY KEY (id)
);

ALTER TABLE cars
ALTER COLUMN deleted_flag SET DEFAULT 0;

INSERT INTO cars (make, model, year) 
VALUES ("Mazda", "Model 3", 2018), 
		("Tesla", "Model S", 2020), 
        ("Acura", "RDX", 2019); 

SELECT * FROM cars; 