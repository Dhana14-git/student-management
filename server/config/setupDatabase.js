'use strict';
/**
 * Database Setup Script
 * Run: node server/config/setupDatabase.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'student_management';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS departments (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(10)  NOT NULL,
    description TEXT,
    head_name   VARCHAR(100),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dept_code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS students (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id      VARCHAR(20)  NOT NULL,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(120) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          ENUM('Male','Female','Other','Prefer not to say') NOT NULL DEFAULT 'Prefer not to say',
    address         VARCHAR(255),
    city            VARCHAR(80),
    state           VARCHAR(80),
    postal_code     VARCHAR(20),
    department_id   INT UNSIGNED,
    enrollment_year YEAR,
    status          ENUM('Active','Inactive','Graduated','Suspended') NOT NULL DEFAULT 'Active',
    gpa             DECIMAL(3,2) DEFAULT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_id (student_id),
    UNIQUE KEY uq_email (email),
    KEY idx_dept (department_id),
    KEY idx_status (status),
    KEY idx_name (last_name, first_name),
    CONSTRAINT fk_student_dept FOREIGN KEY (department_id) REFERENCES departments(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS courses (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    course_code   VARCHAR(20)  NOT NULL,
    title         VARCHAR(150) NOT NULL,
    description   TEXT,
    credits       TINYINT UNSIGNED NOT NULL DEFAULT 3,
    department_id INT UNSIGNED,
    instructor    VARCHAR(100),
    max_capacity  SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_code (course_code),
    KEY idx_course_dept (department_id),
    CONSTRAINT fk_course_dept FOREIGN KEY (department_id) REFERENCES departments(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS enrollments (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id   INT UNSIGNED NOT NULL,
    course_id    INT UNSIGNED NOT NULL,
    semester     VARCHAR(20)  NOT NULL,
    year         YEAR         NOT NULL,
    grade        DECIMAL(4,2) DEFAULT NULL,
    letter_grade ENUM('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F','W','I') DEFAULT NULL,
    status       ENUM('Enrolled','Completed','Dropped','Withdrawn') NOT NULL DEFAULT 'Enrolled',
    enrolled_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_enrollment (student_id, course_id, semester, year),
    KEY idx_enr_course (course_id),
    KEY idx_enr_semester (semester, year),
    CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES students(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enr_course FOREIGN KEY (course_id) REFERENCES courses(id)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const SEED_DEPARTMENTS = [
  ['Computer Science', 'CS',   'Department of Computer Science and Engineering',       'Dr. Alan Turing'],
  ['Mathematics',      'MATH', 'Department of Pure and Applied Mathematics',           'Dr. Emmy Noether'],
  ['Physics',          'PHY',  'Department of Physics and Astronomy',                  'Dr. Richard Feynman'],
  ['Business',         'BUS',  'Department of Business Administration and Management', 'Dr. Peter Drucker'],
  ['Engineering',      'ENG',  'Department of Mechanical and Electrical Engineering',  'Dr. Nikola Tesla'],
];

const SEED_COURSES = [
  ['CS101',   'Introduction to Programming',  'Fundamentals of programming using Python', 3, 1, 'Prof. Knuth',     35],
  ['CS201',   'Data Structures & Algorithms', 'Arrays, trees, graphs, sorting',           4, 1, 'Prof. Sedgewick', 30],
  ['CS301',   'Database Systems',             'Relational databases, SQL, normalization', 3, 1, 'Prof. Codd',      28],
  ['MATH101', 'Calculus I',                   'Limits, derivatives, integrals',           4, 2, 'Prof. Newton',    40],
  ['MATH201', 'Linear Algebra',               'Vectors, matrices, eigenvalues',           3, 2, 'Prof. Gauss',     35],
  ['PHY101',  'Classical Mechanics',          'Newton laws, kinematics, dynamics',        4, 3, 'Prof. Einstein',  32],
  ['BUS101',  'Principles of Management',     'Planning, organizing, leading',            3, 4, 'Prof. Porter',    45],
  ['ENG101',  'Engineering Mathematics',      'Differential equations, transforms',       4, 5, 'Prof. Fourier',   30],
];

const SEED_STUDENTS = [
  ['STU001','Alice',  'Johnson', 'alice.johnson@university.edu',  '555-0101','2002-03-15','Female',1,2022,'Active',   3.85],
  ['STU002','Bob',    'Williams','bob.williams@university.edu',   '555-0102','2001-07-22','Male',  1,2021,'Active',   3.40],
  ['STU003','Carol',  'Martinez','carol.martinez@university.edu', '555-0103','2003-01-10','Female',2,2023,'Active',   3.92],
  ['STU004','David',  'Brown',   'david.brown@university.edu',    '555-0104','2000-11-05','Male',  3,2020,'Graduated',3.60],
  ['STU005','Eve',    'Davis',   'eve.davis@university.edu',      '555-0105','2002-06-18','Female',4,2022,'Active',   3.15],
  ['STU006','Frank',  'Wilson',  'frank.wilson@university.edu',   '555-0106','2001-09-30','Male',  5,2021,'Active',   2.95],
  ['STU007','Grace',  'Taylor',  'grace.taylor@university.edu',   '555-0107','2003-04-25','Female',1,2023,'Active',   3.75],
  ['STU008','Henry',  'Anderson','henry.anderson@university.edu', '555-0108','2000-12-12','Male',  2,2020,'Inactive', 2.80],
];

const SEED_ENROLLMENTS = [
  [1,1,'Fall',  2022,92.5,'A', 'Completed'],
  [1,2,'Spring',2023,88.0,'B+','Completed'],
  [1,3,'Fall',  2023,null,null,'Enrolled'],
  [2,1,'Fall',  2021,78.0,'C+','Completed'],
  [2,2,'Spring',2022,85.0,'B', 'Completed'],
  [3,4,'Fall',  2023,null,null,'Enrolled'],
  [3,5,'Fall',  2023,null,null,'Enrolled'],
  [5,7,'Spring',2023,71.0,'C', 'Completed'],
  [6,8,'Fall',  2022,80.5,'B-','Completed'],
];

const run = async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`✅ Database "${DB_NAME}" ready`);

    for (const sql of SCHEMA) await conn.query(sql);
    console.log('✅ All tables created');

    for (const [name,code,desc,head] of SEED_DEPARTMENTS)
      await conn.query(`INSERT IGNORE INTO departments (name,code,description,head_name) VALUES (?,?,?,?)`, [name,code,desc,head]);
    console.log('✅ Departments seeded');

    for (const [code,title,desc,credits,deptId,instructor,cap] of SEED_COURSES)
      await conn.query(`INSERT IGNORE INTO courses (course_code,title,description,credits,department_id,instructor,max_capacity) VALUES (?,?,?,?,?,?,?)`, [code,title,desc,credits,deptId,instructor,cap]);
    console.log('✅ Courses seeded');

    for (const [sid,fn,ln,email,phone,dob,gender,deptId,year,status,gpa] of SEED_STUDENTS)
      await conn.query(`INSERT IGNORE INTO students (student_id,first_name,last_name,email,phone,date_of_birth,gender,department_id,enrollment_year,status,gpa) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [sid,fn,ln,email,phone,dob,gender,deptId,year,status,gpa]);
    console.log('✅ Students seeded');

    for (const [stuId,crsId,sem,yr,grade,lgrade,status] of SEED_ENROLLMENTS)
      await conn.query(`INSERT IGNORE INTO enrollments (student_id,course_id,semester,year,grade,letter_grade,status) VALUES (?,?,?,?,?,?,?)`, [stuId,crsId,sem,yr,grade,lgrade,status]);
    console.log('✅ Enrollments seeded');

    console.log('\n🎉 Setup complete! Run `npm run dev` to start.\n');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
};

run();
