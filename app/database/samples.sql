--- ORACLE: alter session set NLS_DATE_FORMAT='rrrr-mm-dd';
CREATE TABLE category (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200)
);

INSERT INTO category VALUES(1,'Frequente');
INSERT INTO category VALUES(2,'Casual');
INSERT INTO category VALUES(3,'Varejista');

CREATE TABLE state (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200)
);

INSERT INTO state VALUES(1,'RS');
INSERT INTO state VALUES(2,'SP');

CREATE TABLE city (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200),
  state_id INTEGER NOT NULL,
  FOREIGN KEY(state_id) REFERENCES state(id)
);

INSERT INTO city VALUES(1,'Lajeado','1');
INSERT INTO city VALUES(2,'Porto Alegre','1');
INSERT INTO city VALUES(3,'Caxias do Sul','1');
INSERT INTO city VALUES(4,'São Paulo','2');
INSERT INTO city VALUES(5,'Osasco','2');


CREATE TABLE skill (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200)
);

INSERT INTO skill VALUES(1,'Leitura');
INSERT INTO skill VALUES(2,'Escrita');
INSERT INTO skill VALUES(3,'Comunicação');
INSERT INTO skill VALUES(4,'Criatividade');
INSERT INTO skill VALUES(5,'Relações');
INSERT INTO skill VALUES(6,'Organização');
INSERT INTO skill VALUES(7,'Liderança');


CREATE TABLE customer (
  id INTEGER PRIMARY KEY NOT NULL, 
  name VARCHAR(200), 
  address VARCHAR(200), 
  phone VARCHAR(200), 
  birthdate DATE, 
  status CHAR(1), 
  email VARCHAR(200), 
  gender CHAR(1), 
  category_id INTEGER NOT NULL, 
  city_id INTEGER NOT NULL,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME, 
  FOREIGN KEY(city_id)     REFERENCES city(id), 
  FOREIGN KEY(category_id) REFERENCES category(id) 
);

INSERT INTO customer VALUES(1,'Jackie Cooke','Main Lane, 1','10 1234-5678','1980-01-01','S','contact@gmail.com','M',2,3,NULL,'2019-05-19 16:30:06', NULL);
INSERT INTO customer VALUES(2,'Nicky Fox','Sapphire Street, 2','84 4644-5678','1990-01-01','M','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(3,'Logan Roberts','Fortune Lane, 3','84 1564-5345','1990-01-01','C','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(4,'Kerry Marsh','Lilypad Route, 4','84 1124-3478','1990-01-01','C','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(5,'Noel Scott','Fleet Avenue, 5','84 1164-5348','1990-01-01','M','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(6,'Jaden Wells','Dove Boulevard, 6','83 1223-5678','1990-01-01','M','contact@gmail.com','M',1,1,NULL,'2019-05-19 16:29:22', NULL);
INSERT INTO customer VALUES(7,'Hayden Young','Market Avenue, 7','83 1298-5628','1990-01-01','C','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(8,'Erin Wilson','Poplar Way, 8','83 1323-5548','1990-01-01','S','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(9,'Leslie Reid','Apollo Street, 9','83 1266-5666','1990-01-01','C','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(10,'Lane Edwards','Long Avenue, 10','83 1234-5578','1990-01-01','S','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(11,'Jamie Carr','Fox Route, 11','83 1884-5338','1990-01-01','C','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(12,'Angel Johnston','Bellow Street, 12','83 1264-5662','1990-01-01','S','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(13,'Tyler Hamilton','Ebon Lane, 13','83 1243-5658','1990-01-01','M','contact@gmail.com','F',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(14,'Jaime Elliott','Coastline Street, 14','83 1232-5348','1990-01-01','M','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(15,'Caden Clark','Main Avenue, 15','83 1674-9878','1990-01-01','S','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(16,'Carmen Duncan','Wright Boulevard, 16','83 1256-1238','1990-01-01','S','contact@gmail.com','F',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(17,'Blake Harvey','Bridgewater Boulevard, 17','83 1278-5238','1990-01-01','S','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(18,'Bennie Walsh','Achorage Passage, 18','83 1234-3278','1990-01-01','M','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(19,'Bennie Clarke','Lilypad Avenue, 19','83 1784-5348','1990-01-01','M','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(20,'Kai Lawrence','Pearl Avenue, 20','83 1984-5218','1990-01-01','C','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(21,'Elliot Berry','Baker Way, 21','83 1211-5228','1990-01-01','M','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(22,'Rory Thomson','Lilypad Street, 22','83 1233-5558','1990-01-01','M','contact@gmail.com','F',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(23,'Harley Porter','Vale Lane, 23','83 1774-5448','1990-01-01','M','contact@gmail.com','M',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(24,'Ash Burton','Summer Lane, 24','83 1894-5628','1990-01-01','C','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(25,'Bret Thomas','Butcher Lane, 25','83 1259-5631','1990-01-01','C','contact@gmail.com','M',1,3,NULL,NULL, NULL);
INSERT INTO customer VALUES(26,'Jamie Powell','Jewel Lane, 26','83 1208-5088','1990-01-01','M','contact@gmail.com','M',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(27,'Morgan Marshall','Auburn Lane, 27','83 1404-5640','1990-01-01','C','contact@gmail.com','M',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(28,'Addison Green','Globe Street, 28','83 1044-5408','1990-01-01','M','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(29,'Sidney Williamson','Windmill Street, 29','83 1234-5678','1990-01-01','M','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(30,'Ash Hamilton','Dove Avenue, 30','83 1564-4578','1990-01-01','S','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(31,'Jackie Lowe','Lily Street, 31','51 8111-3333','1990-01-01','S','contact@gmail.com','M',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(32,'Gene Hall','Petal Avenue, 32','83 1249-9498','1990-01-01','M','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(33,'Bret Allen','Circus Route, 33','83 1229-2978','1990-01-01','S','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(34,'Jordan Gardner','Cannon Route, 34, 56','83 1259-5598','1990-01-01','M','contact@gmail.com','F',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(35,'Tanner Elliott','Lawn Row, 35','84 1279-9778','1990-01-01','S','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(36,'Ray Morgan','Earl Passage, 36','83 1236-5636','1990-01-01','M','contact@gmail.com','M',1,2,NULL,NULL, NULL);
INSERT INTO customer VALUES(37,'Jess Powell','River Passage, 37','84 1209-5098','1990-01-01','M','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(38,'Aiden Lewis','Fox Route, 38','83 1252-2578','1990-01-01','C','contact@gmail.com','M',1,1,NULL,NULL, NULL);
INSERT INTO customer VALUES(39,'Kiran Saunders','Crimson Street, 39','84 1295-5958','1990-01-01','C','contact@gmail.com','M',1,4,NULL,NULL, NULL);
INSERT INTO customer VALUES(40,'Charlie Wood','Chapel Street, 40','(51) 8111-2222','2013-02-15','S','giovanni@dalloglio.net','M',1,1,NULL,'2019-05-19 16:19:18', NULL);
CREATE TABLE contact (
  id INTEGER PRIMARY KEY NOT NULL, 
  type VARCHAR(200), 
  value VARCHAR(200), 
  customer_id INTEGER NOT NULL, 
  FOREIGN KEY(customer_id) REFERENCES customer(id) 
);

INSERT INTO contact VALUES(1,'fone','78 2343-4545',4);
INSERT INTO contact VALUES(2,'fone','78 9494-0404',4);
INSERT INTO contact VALUES(3,'fone','78 2343-4545',4);
INSERT INTO contact VALUES(4,'fone','78 9494-0404',4);
INSERT INTO contact VALUES(5,'MSN','andrei@msn.com',1);
INSERT INTO contact VALUES(6,'ICQ','6232071023124',1);
INSERT INTO contact VALUES(7,'Gmail','andrei@gmail.com',1);


CREATE TABLE customer_skill (
  id INTEGER PRIMARY KEY NOT NULL, 
  customer_id INTEGER NOT NULL, 
  skill_id INTEGER NOT NULL, 
  FOREIGN KEY(customer_id) REFERENCES customer(id), 
  FOREIGN KEY(skill_id)    REFERENCES skill(id) 
);

INSERT INTO customer_skill VALUES(56,6,5);
INSERT INTO customer_skill VALUES(57,6,7);
INSERT INTO customer_skill VALUES(61,4,1);
INSERT INTO customer_skill VALUES(62,4,2);
INSERT INTO customer_skill VALUES(63,1,1);
INSERT INTO customer_skill VALUES(64,1,2);
INSERT INTO customer_skill VALUES(65,1,4);


CREATE TABLE product(
  id INTEGER PRIMARY KEY NOT NULL,
  description VARCHAR(200),
  stock REAL,
  sale_price REAL,
  unity VARCHAR(200),
  photo_path text
);
INSERT INTO product VALUES(1,'Pendrive 512Mb',10.0,57.6,'PC','files/images/1/pendrive.jpg');
INSERT INTO product VALUES(2,'HD 120 GB',20.0,180.0,'PC','files/images/2/hd.jpg');
INSERT INTO product VALUES(3,'SD CARD  512MB',4.0,35.0,'PC','files/images/3/sdcard.jpg');
INSERT INTO product VALUES(4,'SD CARD 1GB MINI',3.0,40.0,'PC','files/images/4/sdcard.jpg');
INSERT INTO product VALUES(5,'CAM. PHOTO I70 Silver',5.0,900.0,'PC','files/images/5/camera.jpg');
INSERT INTO product VALUES(6,'CAM. PHOTO DSC-W50 Silver',4.0,700.0,'PC','files/images/6/camera.jpg');
INSERT INTO product VALUES(7,'WEBCAM INSTANT VF0040SP',4.0,80.0,'PC','files/images/7/webcam.jpg');
INSERT INTO product VALUES(8,'CPU 775 CEL.D 360 3.46 533M',10.0,300.0,'PC',NULL);
INSERT INTO product VALUES(9,'Recorder DCR-DVD108',2.0,1400.0,'PC',NULL);
INSERT INTO product VALUES(10,'HD IDE  80G 7.200',8.0,160.0,'PC','files/images/10/hd.jpg');
INSERT INTO product VALUES(11,'Printer LASERJET 1018 USB 2.0',4.0,300.0,'PC','images/printer.jpg');
INSERT INTO product VALUES(12,'DDR 512MB 400MHZ PC3200',10.0,100.0,'PC',NULL);
INSERT INTO product VALUES(13,'DDR2 1024MB 533MHZ PC4200',5.0,170.0,'PC',NULL);
INSERT INTO product VALUES(14,'MONITOR LCD 19',2.0,800.0,'PC','images/monitor.jpg');
INSERT INTO product VALUES(15,'MOUSE USB OMC90S OPT.',10.0,40.0,'PC','images/mouse.jpg');
INSERT INTO product VALUES(16,'NB DV6108 CS 1.86/512/80/DVD',2.0,2500.0,'PC',NULL);
INSERT INTO product VALUES(17,'NB N220E/B DC 1.6/1/80/DVD',3.0,3400.0,'PC',NULL);
INSERT INTO product VALUES(18,'CAM. PHOTO DSC-W90 Silver',5.0,1200.0,'PC',NULL);
INSERT INTO product VALUES(19,'CART. 8767 black',20.0,50.0,'PC',NULL);
INSERT INTO product VALUES(20,'CD-R TUBE DE 100 52X 700MB',20.0,60.0,'PC',NULL);
INSERT INTO product VALUES(21,'DDR 1024MB 400MHZ PC3200',7.0,150.0,'PC',NULL);
INSERT INTO product VALUES(22,'MOUSE PS2 A7 Blue',20.0,15.0,'PC','');
INSERT INTO product VALUES(23,'SPEAKER AS-5100 White',5.0,180.0,'PC',NULL);
INSERT INTO product VALUES(24,'Keyb. USB AK-806',14.0,40.0,'PC',NULL);

CREATE TABLE sale_status (id int primary key, name text, color text);
INSERT INTO sale_status VALUES(1,'Quote','#9c9c9c');
INSERT INTO sale_status VALUES(2,'Aproved','#eba52d');
INSERT INTO sale_status VALUES(3,'Processing','#75aaff');
INSERT INTO sale_status VALUES(4,'Completed','#11d61e');

CREATE TABLE sale (
  id INTEGER PRIMARY KEY NOT NULL,
  date date,
  total float,
  customer_id int,
  obs text, status_id int references sale_status(id),
  FOREIGN KEY(customer_id) REFERENCES customer(id)
);

INSERT INTO sale VALUES(1,'2015-03-14',505.0,1,'',1);
INSERT INTO sale VALUES(2,'2015-03-14',1945.0,2, '',1);
INSERT INTO sale VALUES(3,'2015-03-14',4880.0,3, '',2);
INSERT INTO sale VALUES(4,'2015-03-14',1060.0,4, '',2);
INSERT INTO sale VALUES(5,'2015-03-14',1890.0,5, '',3);
INSERT INTO sale VALUES(6,'2015-03-14',12900.0,6, '',3);
INSERT INTO sale VALUES(7,'2015-03-14',620.0,7, '',3);
INSERT INTO sale VALUES(8,'2015-03-14',495.0,8, '',4);
INSERT INTO sale VALUES(9,'2015-10-26',79.0,1, '',4);
INSERT INTO sale VALUES(10,'2015-10-26',40.0,4,'teste',4);


CREATE TABLE sale_item (
  id INTEGER PRIMARY KEY NOT NULL,
  sale_price float,
  amount float,
  discount float,
  total float,
  product_id int,
  sale_id int,
  FOREIGN KEY(product_id) REFERENCES product(id),
  FOREIGN KEY(sale_id) REFERENCES sale(id)
);

INSERT INTO sale_item VALUES(1,40.0,1.0,0.0,40.0,1,1);
INSERT INTO sale_item VALUES(2,180.0,2.0,0.0,360.0,2,1);
INSERT INTO sale_item VALUES(3,35.0,3.0,0.0,105.0,3,1);
INSERT INTO sale_item VALUES(4,40.0,1.0,0.0,40.0,4,2);
INSERT INTO sale_item VALUES(5,900.0,2.0,0.0,1800.0,5,2);
INSERT INTO sale_item VALUES(6,35.0,3.0,0.0,105.0,3,2);
INSERT INTO sale_item VALUES(7,80.0,1.0,0.0,80.0,7,3);
INSERT INTO sale_item VALUES(8,300.0,2.0,0.0,600.0,8,3);
INSERT INTO sale_item VALUES(9,1400.0,3.0,0.0,4200.0,9,3);
INSERT INTO sale_item VALUES(10,160.0,1.0,0.0,160.0,10,4);
INSERT INTO sale_item VALUES(11,300.0,2.0,0.0,600.0,11,4);
INSERT INTO sale_item VALUES(12,100.0,3.0,0.0,300.0,12,4);
INSERT INTO sale_item VALUES(13,170.0,1.0,0.0,170.0,13,5);
INSERT INTO sale_item VALUES(14,800.0,2.0,0.0,1600.0,14,5);
INSERT INTO sale_item VALUES(15,40.0,3.0,0.0,120.0,15,5);
INSERT INTO sale_item VALUES(16,2500.0,1.0,0.0,2500.0,16,6);
INSERT INTO sale_item VALUES(17,3400.0,2.0,0.0,6800.0,17,6);
INSERT INTO sale_item VALUES(18,1200.0,3.0,0.0,3600.0,18,6);
INSERT INTO sale_item VALUES(19,50.0,1.0,0.0,50.0,19,7);
INSERT INTO sale_item VALUES(20,60.0,2.0,0.0,120.0,20,7);
INSERT INTO sale_item VALUES(21,150.0,3.0,0.0,450.0,21,7);
INSERT INTO sale_item VALUES(22,15.0,1.0,0.0,15.0,22,8);
INSERT INTO sale_item VALUES(23,180.0,2.0,0.0,360.0,23,8);
INSERT INTO sale_item VALUES(24,40.0,3.0,0.0,120.0,24,8);
INSERT INTO sale_item VALUES(25,40.0,2.0,1.0,79.0,1,9);
INSERT INTO sale_item VALUES(26,40.0,1.0,0.0,39.0,4,10);


CREATE TABLE trash_item (id INTEGER PRIMARY KEY NOT NULL, content text);
INSERT INTO trash_item values (1, 'Content #1');
INSERT INTO trash_item values (2, 'Content #2');
INSERT INTO trash_item values (3, 'Content #3');
INSERT INTO trash_item values (4, 'Content #4');
INSERT INTO trash_item values (5, 'Content #5');
INSERT INTO trash_item values (6, 'Content #6');
INSERT INTO trash_item values (7, 'Content #7');
INSERT INTO trash_item values (8, 'Content #8');
INSERT INTO trash_item values (9, 'Content #9');
INSERT INTO trash_item values (10, 'Content #10');
INSERT INTO trash_item values (11, 'Content #11');
INSERT INTO trash_item values (12, 'Content #12');
INSERT INTO trash_item values (13, 'Content #13');
INSERT INTO trash_item values (14, 'Content #14');
INSERT INTO trash_item values (15, 'Content #15');
INSERT INTO trash_item values (16, 'Content #16');
INSERT INTO trash_item values (17, 'Content #17');
INSERT INTO trash_item values (18, 'Content #18');
INSERT INTO trash_item values (19, 'Content #19');
INSERT INTO trash_item values (20, 'Content #20');


CREATE TABLE agenda_entry (
  id INTEGER PRIMARY KEY NOT NULL,
  entry_date date,
  start_hour int,
  duration int,
  title text,
  description text
);


CREATE TABLE calendar_event (
  id INTEGER PRIMARY KEY NOT NULL,
  start_time VARCHAR(200),
  end_time VARCHAR(200),
  title VARCHAR(200),
  description VARCHAR(200),
  color TEXT
);


CREATE TABLE test (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200),
  state_id integer references state(id),
  city_id integer references city(id),
  customer_id integer references customer(id)
);
CREATE TABLE IF NOT EXISTS product_image (id INTEGER PRIMARY KEY NOT NULL, product_id integer references product(id), image text);
INSERT INTO product_image VALUES(1,1,'files/images/1/libreoffice-oasis-text-template.png');
INSERT INTO product_image VALUES(2,1,'files/images/1/libreoffice-oasis-web-template.png');
CREATE TABLE kanban_item (
  id         INTEGER PRIMARY KEY NOT NULL,
  title      TEXT,
  content    TEXT,
  color      TEXT,
  item_order INTEGER,
  stage_id   INTEGER
);

CREATE TABLE kanban_stage (
  id          INTEGER PRIMARY KEY NOT NULL,
  title       TEXT,
  color       TEXT,
  stage_order INTEGER
);

INSERT INTO kanban_stage VALUES(1,'Stage 1','#444',1);
INSERT INTO kanban_stage VALUES(2,'Stage 2','#FFB300',2);
INSERT INTO kanban_stage VALUES(3,'Stage 3','red',3);
INSERT INTO kanban_stage VALUES(4,'Stage 4','blue',4);


INSERT INTO kanban_item VALUES(1,'Item 1.1','ITEM 1','#FF1818',1,1);
INSERT INTO kanban_item VALUES(2,'item 1.2','ITEM 2','#57D557',2,1);
INSERT INTO kanban_item VALUES(3,'item 2.1','ITEM 3','#5950F1',1,2);
INSERT INTO kanban_item VALUES(4,'item 2.2','ITEM 4','#57D557',2,2);
INSERT INTO kanban_item VALUES(5,'item 3.1','ITEM 5','#CC2EC9',1,3);
INSERT INTO kanban_item VALUES(6,'item 4.1','ITEM 6','#5950F1',1,4);

CREATE TABLE gantt_group (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(200)
);


CREATE TABLE gantt_event (
  id INTEGER PRIMARY KEY NOT NULL,
  group_id integer references gantt_group(id),
  start_time VARCHAR(200),
  end_time VARCHAR(200),
  title VARCHAR(200),
  description VARCHAR(200),
  color TEXT,
  percent int
);

insert into gantt_group values (1, 'Group A');
insert into gantt_group values (2, 'Group B');
insert into gantt_group values (3, 'Group C');

insert into gantt_event values (1, 1, '2022-01-01 00:00:00', '2022-01-05 23:59:00', 'Event A.1', 'Event A.1 description', '#0000FF', 30);
insert into gantt_event values (2, 1, '2022-01-02 00:00:00', '2022-01-06 23:59:00', 'Event A.2', 'Event A.2 description', '#0000FF', 30);
insert into gantt_event values (3, 2, '2022-01-03 00:00:00', '2022-01-07 23:59:00', 'Event B.1', 'Event B.1 description', '#65E05D', 50);
insert into gantt_event values (4, 2, '2022-01-04 00:00:00', '2022-01-08 23:59:00', 'Event B.2', 'Event B.2 description', '#65E05D', 50);
insert into gantt_event values (5, 3, '2022-01-05 00:00:00', '2022-01-09 23:59:00', 'Event C.1', 'Event C.1 description', '#D45DE0', 80);
insert into gantt_event values (6, 3, '2022-01-06 00:00:00', '2022-01-10 23:59:00', 'Event C.2', 'Event C.2 description', '#D45DE0', 80);


CREATE VIEW view_sales as
select
   id,
   name,
   address,
   phone,
   birthdate,
   status,
   email,
   gender,
   city_id,
   category_id,
   (
      select
	 sum(total)
      from
	 sale
      where
	 customer_id = customer.id
   )
   as total,
   (
      select
	 max(date)
      from
	 sale
      where
	 customer_id = customer.id
   )
   as last_date
from
   customer;
