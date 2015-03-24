#!/usr/bin/python

import sys
import nltk 
import json

def parse_text(inputText):
    out = list()
    for para in inputText.splitlines():
        pList = list()
        safeprint(para);
        safeprint('ˇ');
        sents = nltk.sent_tokenize(para.decode('utf-8'))
        for sent in sents:
            sList = list()
            token = nltk.word_tokenize(sent);
         #   process(token);
            for (word,tag) in nltk.pos_tag(token):
                sList.append(word)
                sList.append(tag)
            pList.append(sList)
        out.append(pList)
    print(json.dumps(out))

#for future update,
# for each token, check if it begin or end with unicode character
# break them into individual token.
def process(token):
    l = list();
    for str in token:
        try:
            str.decode('ascii')
        except UnicodeEncodeError:
            startUnicode = ord(str[0])>=128  #check if first character is unicode
            if startUnicode:

                for c in str:
                    print ord(c)
        else:
            l.append(str)

def safeprint(s):
    try:
        print(s)
    except UnicodeEncodeError:
        if sys.version_info >= (3,):
            print(s.encode('utf8').decode(sys.stdout.encoding))
        else:
            print(s.encode('utf8'))

def main(argv):
    parse_text(argv[1])

if __name__ == '__main__':
    argv = sys.argv
    main(argv)