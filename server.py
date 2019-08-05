from sys import stderr, exit, argv
from flask import Flask, jsonify, request, session, escape
import json


app = Flask(__name__, static_url_path='/static')

@app.route('/feedback', methods=['POST'])
def store_feedback() :
    post = request.get_json()
    print >> stderr, post

    with open('INTERACTION_DATA.json', 'a') as f :
        print >> f, json.dumps(post)

    return jsonify({}), 200

@app.after_request
def after_request(response) :
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def root() :
    return app.send_static_file('tetris.html')

if __name__ == '__main__' :
    app.run(debug=True)

