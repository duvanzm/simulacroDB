# NAME PROYECT


# STUDENT INFORMATION


Name: Duvan Alexander Zuluaga Macias
ID Number: 1045113839
Clan: Mc Carthy
GitHub Repository:

---

# PROJECT DESCRIPTION


This project consists of a REST API developed with Node.js and Express
that allows bulk data uploads from CSV files into a MySQL database.

Additionally, each insertion operation is recorded in MongoDB
in order to maintain system logs and audit control.

The project implements a hybrid architecture using:

- Relational database (MySQL) for structured data.
- NoSQL database (MongoDB) for event storage and logging.

---

# TECHNOLOGIES USED


- Node.js
- Express
- MySQL
- MongoDB
- Multer (file upload handling)
- csv-parse (CSV processing)

---

# STEPS TO RUN THE PROJECT LOCALLY


1. Clone the repository

   git clone repo

2. Install dependencies

   cd repo
   npm install express multer csv-parse mysql2 mongodb

3. Create the tables in the database

   - Run the DDL commands in your database ORM

4. Start the server

   node index.js

5. Use Postman for Insertions and Queries

---

# MODEL JUSTIFICATION


I applied the normalization forms 1NF, 2NF, and 3NF
to decompose the information into related tables
and eliminate redundancy while maintaining data integrity.

---

# EXPLANATION OF THE NORMALIZATION PROCESS OR NOSQL DESIGN


Initial Data:

![img](./img)

Entities:
- Users

The relational model was designed following normalization rules.
MongoDB is used to store logs and system events,
allowing flexible and scalable event tracking.

---

# GUIDE TO THE BULK MIGRATION PROCESS


The process works as follows:

1. The user sends a CSV file through a POST request.
2. Multer temporarily stores the file in the uploads/ folder.
3. The system reads the file using fs.createReadStream.
4. The csv-parse package converts each row into a JavaScript object.
5. A bulk INSERT query is constructed.
6. The data is inserted into MySQL.
7. The action is logged in MongoDB.
8. The number of inserted records is returned.

---

# ENDPOINT DESCRIPTION


1. Upload Positions

   POST Endpoint:
   /api/upload/cargos

   Description:
   Allows uploading a CSV file and loading the data
   into the cargos table.



2. Upload Authors

   POST Endpoint:
   /api/upload/autores

   Description:
   Allows uploading a CSV file and loading the data
   into the autores table.



3. Get Logs

   GET Endpoint:
   /logs

   Description:
   Returns all records stored in MongoDB
   ordered by descending date.

---