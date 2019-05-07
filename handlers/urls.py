from handlers.hdr_handlers import *
from tornado import web

handlers = [
    (r'^/hdr-desktop', desktopHandler),
    (r'^/desktop', desktopImgHandler),
    (r'^/hdr-mobile', mobileHandler),
    (r'^/connect', Connect),
]