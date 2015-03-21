#!/usr/bin/python

import sys
import nltk 
import json



def parse_text(inputText):
	out = list()
	for para in inputText.splitlines():
		pList = list()
		sents = nltk.sent_tokenize(para.decode('utf-8'))
		for sent in sents:
			sList = list()
			for (word,tag) in nltk.pos_tag(nltk.word_tokenize(sent)):
				sList.append(word)
				sList.append(tag)
			pList.append(sList)
		out.append(pList)
	print(json.dumps(out))
            


def main(argv):
    parse_text(argv[1])

if __name__ == '__main__':
    argv = sys.argv
    main(argv)