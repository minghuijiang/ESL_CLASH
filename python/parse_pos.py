#!/usr/bin/python

import sys
import nltk 
import json

delimiter = 'ˇ'.encode('utf8');
sentDeli = '\n';
paraDeli ='\n\r';

def parse_text(inputText):
    result = '';
    for para in inputText.splitlines():
        sents = nltk.sent_tokenize(para.decode('utf-8'))
        for sent in sents:
            token = nltk.word_tokenize(sent);
         #   process(token);
            for (word,tag) in nltk.pos_tag(token):
                result+=word+delimiter+tag+delimiter;
            result+=sentDeli;
        result+=paraDeli;
    print result;

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



def main(argv):
    parse_text(argv[1])

if __name__ == '__main__':
    argv = sys.argv
    main(argv)