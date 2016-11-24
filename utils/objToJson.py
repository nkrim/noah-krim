#!/usr/bin/python
from __future__ import print_function

import argparse
import json
import os
import sys

VERTEX_LEN = 3
INDEX_LEN = 3

def parser():
	parser = argparse.ArgumentParser(description='Converts .obj files to json for use with model.js script')
	parser.add_argument('files', nargs='+', help='files to convert')
	return parser

def main():
	args = parser().parse_args()
	for file in args.files:
		try:
			with open(file) as f:
				data = parse(f)		
		except IOError as e:
			print('Error loading file: %s' % e, file=sys.stderr)
		except ParseError as e:
			print('Error parsing file: %s' % e, file=sys.stderr)
		else:
			try:
				out = os.path.splitext(file)[0]+'.json'
				with open(out, 'w') as f:
					outJson(f, data)
			except IOError as e:
				print('Error writing file: %s' % e, file=sys.stderr)
			else:
				print('Success: %s -> %s' % (file, out))

def outJson(file, data):
	json.dump(data, file, separators=(',',':'), sort_keys=True)

def parse(file):
	data = {}
	obj = None
	lineno = 0
	vlen = VERTEX_LEN+1
	ilen = INDEX_LEN+1
	for line in file:
		lineno += 1
		split = line.split()
		if len(split) == 0:
			pass
		elif split[0] == 'o':
			if len(split) < 2:
				raise ParseError(ParseError.NO_OBJECT_NAME, lineno)
			if obj:
				if len(obj['vertices']) == 0:
					raise ParseError(ParseError.NO_VERTICES, lineno)
				if len(obj['indices']) == 0:
					raise ParseError(ParseError.NO_INDICES, lineno)
			obj = {'vertices':[], 'indices':[]}
			data[split[1]] = obj
		elif split[0] == 'v':
			if not obj:
				raise ParseError(ParseError.NO_OBJECT, lineno)
			if len(split) < vlen:
				raise ParseError(ParseError.TOO_FEW_VERTEX, lineno)
			try:
				obj['vertices'] += [float(split[i]) for i in range(1,vlen)]
			except ValueError:
				raise ParseError(ParseError.FLOAT_VALUE_ERROR, lineno)
		elif split[0] == 'f':
			if not obj:
				raise ParseError(ParseError.NO_OBJECT, lineno)
			if len(split) < ilen:
				raise ParseError(ParseError.TOO_FEW_INDEX, lineno)
			try:
				obj['indices'] += [int(split[i]) for i in range(1,ilen)]
			except ValueError:
				raise ParseError(ParseError.INT_VALUE_ERROR, lineno)
	if obj:
		if len(obj['vertices']) == 0:
			raise ParseError(ParseError.NO_VERTICES, lineno)
		if len(obj['indices']) == 0:
			raise ParseError(ParseError.NO_INDICES, lineno)
	return data

class ParseError(RuntimeError):
	NO_OBJECT = 'Object attributes defined before an object has been declared'
	NO_OBJECT_NAME = 'No name provided with object declaration'
	NO_VERTICES = 'Object declared with no vertices'
	TOO_FEW_VERTEX = 'Too few values defined in vertex declaration (expected %d)' % VERTEX_LEN
	NO_INDICES = 'Object declared with no indices'
	TOO_FEW_INDEX = 'Too few indices defined in face declaration (expected %d)' % INDEX_LEN
	INT_VALUE_ERROR = 'Error parsing int'
	FLOAT_VALUE_ERROR = 'Error parsing float'

	def __init__(self, reason, lineno):
		self.reason = reason
		self.lineno = lineno

if __name__ == '__main__':
	main()