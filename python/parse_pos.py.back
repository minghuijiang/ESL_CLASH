#!/usr/bin/python

import sys
import nltk 



def parse_text(inputText):
    tokenized_text = nltk.word_tokenize(inputText)
    return nltk.pos_tag(tokenized_text)

def createJSON(pos_tag):
    print pos_tag
    
    #for p in pos_tag:
    #    print p
        
            


def main(argv):
    pos_tag = parse_text(argv)
    json_out = createJSON(pos_tag)

if __name__ == '__main__':
    #testing code
    argv = raw_input("")
    main(argv)
    
    #live code
    #argv = sys.argv
    #main(argv)