"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user_name, get_user

url_signer = URLSigner(session)

@action('index')
@action.uses(db, auth, 'index.html')
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url=URL('my_callback', signer=url_signer),
        load_contacts_url=URL('load_contacts', signer=url_signer),
        add_contact_url=URL('add_contact', signer=url_signer),
        delete_contact_url=URL('delete_contact', signer=url_signer),
        get_rating_url=URL('get_rating', signer=url_signer),
        set_rating_url=URL('set_rating', signer=url_signer),
        upload_image_url=URL('upload_image', signer=url_signer),
        email=get_user_email()
    )

# This is our very first API function.
@action('load_contacts')
@action.uses(url_signer.verify(), db)
def load_contacts():
    rows = db(db.contact).select().as_list()
    email = get_user_email()
    print(rows)
    return dict(rows=rows, email=email)

@action('add_contact', method="POST")
@action.uses(url_signer.verify(), db)
def add_contact():
    name = get_user_name()
    email = get_user_email()
    id = db.contact.insert(
        post_content=request.json.get('post_content'),
        name=name,
        email=email
    )
    return dict(id=id, name=name, email=email)

@action('delete_contact')
@action.uses(url_signer.verify(), db)
def delete_contact():
    id = request.params.get('id')
    assert id is not None
    db(db.contact.id == id).delete()
    return "ok"

@action('get_rating')
@action.uses(url_signer.verify(), db, auth.user)
def get_rating():
    """Returns the rating for a user and an image."""
    post_id = request.params.get('post_id')
    row = db((db.thumbs.contact == post_id) &
             (db.thumbs.rater == get_user())).select().first()
    # rating will be -1, 1, or 0
    # indicates thumbs down, thumbs up, or both empty, respectively
    rating = row.rating if row is not None else 0
    return dict(rating=rating)

@action('set_rating', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def set_rating():
    """Sets the rating for an image."""
    post_id = request.json.get('post_id')
    rating = request.json.get('rating')
    print("post_id: " + str(post_id) + ", rating: " + str(rating))
    assert post_id is not None and rating is not None
    db.thumbs.update_or_insert(
        ((db.thumbs.contact == post_id) & (db.thumbs.rater == get_user())),
        contact=post_id,
        rater=get_user(),
        rating=rating
    )
    return "ok" # Just to have some confirmation in the Network tab.

@action('upload_image', method="POST")
@action.uses(url_signer.verify(), db)
def upload_image():
    post_id = request.json.get('post_id')
    image = request.json.get('image')
    db.contact.update_or_insert(
        db(db.contact.id == post_id),
        image=image,
                                )
    return "ok"

