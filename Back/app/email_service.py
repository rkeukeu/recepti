# email_service.py
import json
from datetime import datetime
from flask import current_app

class EmailService:
    @staticmethod
    def send(to_email, subject, body, email_type='system'):
        """Glavna metoda za 'slanje' emaila"""
        
        # 1. SIMULACIJA - štampaj u konzolu
        print(f"\n{'='*60}")
        print(f"📧 EMAIL SIMULACIJA [{email_type.upper()}]")
        print(f"Vreme: {datetime.now().strftime('%d.%m.%Y. %H:%M:%S')}")
        print(f"Za: {to_email}")
        print(f"Naslov: {subject}")
        print(f"Telo:\n{body}")
        print(f"{'='*60}\n")
        
        # 2. LOGOVANJE U REDIS
        try:
            email_data = {
                'to': to_email,
                'subject': subject,
                'body': body,
                'type': email_type,
                'status': 'simulated',
                'timestamp': datetime.now().isoformat(),
                'id': f"email_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
            }
            
            # Sačuvaj u Redis (ako postoji)
            if hasattr(current_app, 'redis'):
                key = f"email_log:{email_data['id']}"
                current_app.redis.setex(key, 86400, json.dumps(email_data))
                print(f"✅ Email saved to Redis: {key}")
                
                # Dodaj u listu svih emailova
                list_key = "email_logs:all"
                current_app.redis.lpush(list_key, key)
                current_app.redis.ltrim(list_key, 0, 99)
            
        except Exception as e:
            print(f"⚠️ Redis logging failed: {e}")
        
        return {'success': True, 'id': email_data.get('id', 'simulated')}
    
    @staticmethod
    def get_logs(limit=50):
        """Vrati sve email logove"""
        try:
            if not hasattr(current_app, 'redis'):
                return []
            
            keys = current_app.redis.keys("email_log:*")
            emails = []
            
            for key in keys[:limit]:
                data = current_app.redis.get(key)
                if data:
                    emails.append(json.loads(data))
            
            # Sortiraj po timestampu (najnovije prvo)
            emails.sort(key=lambda x: x['timestamp'], reverse=True)
            return emails
            
        except Exception as e:
            print(f"⚠️ Failed to get email logs: {e}")
            return []
    
    @staticmethod
    def get_stats():
        """Vrati statistiku emailova"""
        try:
            if not hasattr(current_app, 'redis'):
                return {'total': 0, 'by_type': {}, 'today': 0}
            
            keys = current_app.redis.keys("email_log:*")
            
            stats = {
                'total': len(keys),
                'by_type': {},
                'today': 0
            }
            
            today = datetime.now().date()
            
            for key in keys:
                data = current_app.redis.get(key)
                if data:
                    email = json.loads(data)
                    email_type = email.get('type', 'unknown')
                    stats['by_type'][email_type] = stats['by_type'].get(email_type, 0) + 1
                    
                    # Proveri da li je danas
                    timestamp = datetime.fromisoformat(email['timestamp'])
                    if timestamp.date() == today:
                        stats['today'] += 1
            
            return stats
            
        except Exception as e:
            print(f"⚠️ Failed to get email stats: {e}")
            return {'total': 0, 'by_type': {}, 'today': 0}