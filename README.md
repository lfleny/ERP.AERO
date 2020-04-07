# REST-сервис для управления опросами

Настройки доступа к базе данных и "секреты" для генерации jwt-токенов:

./.env.production

DB= //Имя БД <br/>
DB_USER= //Пользователь БД <br/>
DB_PASS= //Пароль пользователя БД <br/>
DIALECT=mysql  <br/>
SECRET_ACCESS=fSfhKjbDLhdJpztFGF5KSY1RpBNfVVG2KjrAmCTE // Секрет access токена <br/>
SECRET_REFRESH=zTFebbD6tFa6ixGGupRwGtqlHw6Xomd5iVCIVxY6x8WNI // Секрет refresh токена <br/>

Все запросы (кроме signin/signup) требуют авторизации по токену
Токены передаются в заголовке запроса:
Access-Control-Expose-Headers: x-token, x-refresh-token
x-token: "access token"
x-refresh-token: "refresh token"


## Список запросов:
### - Авторизация пользователя по id и паролю
####  POST /signin
  {
    "id": "",
    "password": ""
  }
### - Обновление пары токенов
####  POST /signin/new_token
  
### - Регистрация нового пользователя 
####  Post /signup
  
  {
    "id": "",
    "password": ""
  }
  
### - Загрузка файла
  
####  POST /file/upload
  
  form-data
    file - поле, содержащее загружаемый файл
  
### - Запросить список загруженных файлов и информацию по ним
####  GET /file/list
list_size, page - необезательные параметры (10 и 1 по умолчанию)
  
  {
    "list_size": int,
    "page": int
  }
  
### - Удаление файла по id
####  DELETE /file/delete/:id
  
  id - id удаляемого файла
 
### -  Вывод информации о выбранном файле
####  GET /file/:id
  
  id - id файла
  
### -  Загрузка файла
####  GET /file/download/:id
  
  id - id файла
  
### -  Обновление загруженного файла
####  PUT /file/update/:id
  
  id - id файла
  form-data
    file - поле, содержащее загружаемый файл
    
### - Получение id пользователя
####  GET /info
 
### - Выйти из системы
####  GET /logout

после выхода из системы текущий access токен пользователя попадает в blacklist.
