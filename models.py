"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user():
    return auth.current_user.get('id') if auth.current_user else None

def get_user_name():
    return auth.current_user.get('first_name') +  " " + auth.current_user.get('last_name') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('upload',
                Field('owner', default=get_user_email),
                Field('file_name'),
                Field('file_type'),
                Field('file_date'),
                Field('file_path'),
                Field('file_size', 'integer'),
                Field('confirmed', 'boolean', default=False), # Was the upload to GCS confirmed?
                )

db.define_table('contact',
                Field('post_content'),
                Field('name'),
                Field('email'),
                Field('image_url')
                )

db.define_table('thumbs',
                Field('contact', 'reference contact'),
                Field('rating', 'integer', default=0),
                Field('rater', 'reference auth_user', default=get_user),)

# db.define_table('profile_info',
#                 Field('user_id', 'reference user'),
#                 Field('Bio'),
#                 Field('Favorite'),
# )
                
db.commit()
