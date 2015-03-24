#!/usr/bin/python

import sys
import nltk 
import json
import locale


def parse_text(inputText):
    out = list()
    print locale.getdefaultlocale()
    for para in inputText.splitlines():
        pList = list()
        sents = nltk.sent_tokenize(para.decode('utf-8'))
        for sent in sents:
            sList = list()
            token = nltk.word_tokenize(sent);
            for (word,tag) in nltk.pos_tag(token):
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