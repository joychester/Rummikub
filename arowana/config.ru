require './app'

run Arowana::App

#or you can run against thin web server to set its port
#Rack::Handler::Thin.run Arowana::App, :Port => 9001 , Host => "0.0.0.0"
