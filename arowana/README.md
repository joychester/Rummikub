#Structuring Sinatra Web Application Scaffold
  
-----------------
Starting from here to create your own web applications, or you want to learn how to wirte a sinatra module based app by example  

##Folder structure for Arowana:  
![folder-chart](https://github.com/joychester/Arowana/blob/master/Arowana_FolderStructure.png)  

##MVC flow chart:  
![MVC-chart](https://github.com/joychester/Arowana/blob/master/Arowana_MVC_Relations.png)  

##Precondition:  
* bundle install  
* check how to start the postgresql service in [c9.io](https://docs.c9.io/setting_up_postgresql.html)  
```
sudo service postgresql start
```
* open psql prompt  
```
sudo sudo -u postgres psql
```

* set `username`/`pwd` as `postgres`/`root` if you use my default settings
```
postgres=# ALTER ROLE postgres WITH PASSWORD 'root';  
```

* create sinatra_web DB  
```
postgres=# create database "sinatra_web";
```
* list DBs  
```
postgres=# \list
```
* connect sinatra_web DB
```
postgres=# \c sinatra_web
```

* create "user" table in postgresql DB  
```
CREATE TABLE "user" (
	id serial Primary key NOT NULL,
	username varchar(50) NOT NULL,
	pwd varchar(50) NOT NULL,
	permission varchar(10) NOT NULL
);
```

* list tables
```
sinatra_web=# \dt
```

* insert one record into user table  
```
INSERT INTO "user" (username, pwd, permission) VALUES ('admin', 'admin', 'rw');
```

* quit 
```
sinatra_web=# \q
```
* more psql commands, refer to [docs](http://www.postgresql.org/docs/9.4/static/app-psql.html)  

##How to run  
### On c9.io:  
```
$ rackup config.ru -p $PORT -o $IP  
```
### On your local machine:  
```
$ rackup config.ru  
```  
##Thanks To 
[Sinatra Framework](http://www.sinatrarb.com/)  
[Structuring Sinatra Applications](http://blog.sourcing.io/structuring-sinatra)  
[Structuring Sinatra Apps](http://graybike.co/2014/09/27/structuring-sinatra-apps-part-1/)  
[c9.io](https://c9.io/)  
