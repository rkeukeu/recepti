from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_cors import CORS  # Uvezi CORS
from redis import Redis
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()
db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")
mail = Mail()

def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={r"/*": {
    "origins": "http://localhost:4200",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
    }})
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24) # Token traje 24 sata
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    #app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    #app.config['JWT_CSRF_CHECK_FORM'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Kreiraj uploads folder ako ne postoji
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.config.update(
        MAIL_SERVER=os.getenv('MAIL_SERVER'),
        MAIL_PORT=int(os.getenv('MAIL_PORT') or 2525),
        MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
        MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
        MAIL_USE_TLS=os.getenv('MAIL_USE_TLS') == 'True',
        MAIL_USE_SSL=False
    )
    
    db.init_app(app)
    JWTManager(app)
    socketio.init_app(app)
    mail.init_app(app)
    
    app.redis = Redis(
        host=os.getenv('REDIS_HOST'), 
        port=int(os.getenv('REDIS_PORT') or 6379), 
        decode_responses=True
    )

    from .routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from .recipe_routes import recipe_bp
    app.register_blueprint(recipe_bp, url_prefix='/recepti')

    with app.app_context():
        from .models import User, Recipe
        db.create_all()
        
    return app