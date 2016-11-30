#!/usr/bin/python
from __future__ import print_function

import argparse
import json
import os
import sys
import re

VERTEX_LEN = 3
INDEX_LEN = 3

def parser():
	parser = argparse.ArgumentParser(description='Converts .obj files to json for use with model.js script')
	parser.add_argument('files', nargs='+', help='files to convert')
	parser.add_argument('-n', '--normals',
						action='store_true',
						help='If set, the parser will include a `normals` list in the json doc, and the face indices will try and acquire normal indices as well')
	parser.add_argument('-t', '--textures',
						action='store_true',
						help='If set, the parser will include a `texture` list in the json doc, and the face indices will try and acquire texture indices as well')
	return parser

def main():
	args = parser().parse_args()

	floatPattern = r'(-?\d+(?:\.\d+(?:e-?\d+)?)?)'
	indexPattern = r'(\d+)(?:\/(\d+)?)?(?:\/(\d+))?'
	collectors = {}
	collectors['vertices'] = DataCollector(	r'v {0} {0} {0}'.format(floatPattern),
											[],
											lambda groups: [float(v) for v in groups],
											lambda data, val: data.append(val)	)
	collectors['normals'] = DataCollector(	r'vn {0} {0} {0}'.format(floatPattern),
												[],
												lambda groups: [float(v) for v in groups],
												lambda data, val: data.append(val)	)
	collectors['textures'] = DataCollector(	r'vt {0} {0}'.format(floatPattern),
											[],
											lambda groups: [float(v) for v in groups],
											lambda data, val: data.append(val)	)
	indicesStride = 1 
	indicesLength = 3
	indicesArray = True
	if not (args.normals or args.textures):
		indicesLength = 1
		indicesArray = False
		del collectors['normals']
		del collectors['textures']
	elif args.normals:
		indicesStride = 2
		del collectors['textures']
	elif args.textures:
		indicesLength = 2
		del collectors['normals']

	if indicesArray:
		indicesConvert = lambda groups: [[int(v or 0)-1 for v in groups[i:i+indicesLength:indicesStride]] for i in range(9)[::3]]
	else:
		indicesConvert = lambda groups: [int(v or 0)-1 for v in groups[::3]]

	collectors['indices'] = DataCollector(	re.compile(r'f {0} {0} {0}'.format(indexPattern)),
											[],
											indicesConvert,
											lambda data, val: data.append(val)	)

	for file in args.files:
		try:
			with open(file) as f:
				data = parse(f, collectors)		
		except IOError as e:
			print('Error loading file: %s' % e, file=sys.stderr)
		except Exception as e:
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

def parse(file, collectors):
	for line in file:
		for key, collector in collectors.items():
			if collector.collect(line):
				break
	return {key: col.reset() for key,col in collectors.items()}



class DataCollector:
	REGEXTYPE = type(re.compile(''))
	FUNCTYPE = type(lambda:None)

	def __init__(self, pattern, initial, convert, append):
		# Set `data` to initial value
		self.initial = initial
		self.data = initial

		# Set `pattern` to regex pattern, or compile the string, or raise TypeError
		if isinstance(pattern, DataCollector.REGEXTYPE):
			self.pattern = pattern
		elif isinstance(pattern, str):
			self.pattern = re.compile(pattern)
		else:
			raise TypeError('DataCollector: `pattern` must be either a string or a compiled regex pattern' % pattern)

		# Set `convert` to function, or raise TypeError
		if isinstance(convert, DataCollector.FUNCTYPE):
			self.convert = convert
		else:
			raise TypeError('DataCollector: `convert` must be a function')

		# Set `append` to function, or raise TypeError
		if isinstance(append, DataCollector.FUNCTYPE):
			self.append = append
		else:
			raise TypeError('DataCollector: `append` must be a function')

	def reset(self):
		ret = self.data
		self.data = self.initial
		return ret

	def collect(self, line):
		m = self.pattern.match(line)
		if m:
			self.append(self.data, self.convert(m.groups()))
			return True
		return False

	def data(self):
		return self.data

if __name__ == '__main__':
	main()