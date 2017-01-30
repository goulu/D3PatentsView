#!/usr/bin/python
# -*- coding: utf-8 -*-
from itertools import count


__author__ = "Philippe Guglielmetti"
__copyright__ = "Copyright 2016, BOBST SA Lausanne Switzerland"
__license__ = "All rights reserved"

import logging
import requests
import json

from itertools import count

from Goulib import container, datetime2, itertools2, graph

import networkx as nx # http://networkx.github.io/
    
def quotelist(l):
    l=set(l)
    try:
        l.remove(None)
    except KeyError:
        pass
    l=list(l)
    return '["'+'","'.join(l)+'"]'
    
def query(q,f=None,o='{"per_page":1000}'):
    """
    calls PatentsView API
    #http://www.patentsview.org/api/query-language.html 
    """
    url = 'http://www.patentsview.org/api/patents/query'
    res=[]
    for p in count(1):
        n=1000
        o='{"page":%d,"per_page":%d}'%(p,n)
        query='?q='+q+(' &f='+quotelist(f) if f else '')+' &o='+o
        r = requests.get(url+query)
        try:
            r=r.json()
        except json.JSONDecodeError:
            logging.error(r.reason)
            continue
        r=r['patents']
        res.extend(r)
        if len(r)<n: break
    return res

def patents(numbers):
    """ get a list of Patents by their number
    takes care of avoiding too long requests
    """
    fields=["patent_number","patent_title","patent_date",
        "assignee_organization","inventor_last_name",
        "cited_patent_number",
        "citedby_patent_number",
    ]
    res=[]
    for l in itertools2.chunks(numbers,100):
        n=quotelist(l)
        results = query('{"patent_number":%s}'%n,fields)
        res.extend([Patent(r) for r in results])
    return res
    

class Patent(container.Record):
      
    @property
    def assignee(self):
        res=self.assignees[0]['assignee_organization']
        if res is None:
            res='Unknown'
        return res
        
assignees=[]
refdate=datetime2.datetimef('01/01/1990',fmt='%d/%m/%Y') # ~ today - 25 years

class PatentGraph(nx.DiGraph):
    """ directed graph
    node names are patent numbers
    """
    def add(self, patent, link=False):
        assignee = patent.assignee
        date=datetime2.datetimef(patent.patent_date) #,fmt='%d/%m/%Y')
        x=(date-refdate).days/365
        try:
            y=assignees.index(assignee)
        except ValueError:
            y=len(assignees)
            print(assignee)
            assignees.append(assignee)
        n=patent.patent_number
        title=patent.patent_title
        attr={ 'assignee':assignee, 'date':date, 'title':title, 'pos':(int(x*10),int(y*10))}
        self.add_node(n,**attr)
        if not link:
            return
        for p in patent.cited_patents:
            self.add_edge(n,p['cited_patent_number'])
        for p in patent.citedby_patents:
            p=p['citedby_patent_number']
            if p: self.add_edge(p,n)

database=PatentGraph()

q='{"_and":[{"_text_any":{"patent_title": "halftoning"}}, {"_gte": {"patent_date": "2010-01-01"}}]}'
level1 = query(q)
level1=[r['patent_number'] for r in level1]
level1=patents(level1)

for p in level1:
    database.add(p,True)
    
q=[]
for p in database:
    node=database[p]
    if 'pos' not in node:
        q.append(p)

level2=patents(q)
for p in level2:
    database.add(p,False)
    
graph.write_json(database,"patents.json")    
graph.write_dot(database,"patents.dot")


