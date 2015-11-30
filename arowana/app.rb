require 'bundler'

Bundler.require

require 'yaml'

#Set current file folder path to the $LOAD_PATH
$: << File.expand_path(File.dirname(__FILE__))

#load common utils and global config settings
require_all 'util'

#load all base module files under app folder, load sequence is important modelmodule > routebase
require 'app/models/modelmodule'
require 'app/routes/routebase'
require 'app/routes/api/apimodule'
require 'app/routes/page/pagemodule'


module Arowana
    
    class App < Sinatra::Application
        
        include Reflection
        
        configure do 
            set :root, App.root #used to construct the default :public_folder
            disable :method_override #disable the POST _method hack
        end
        
        use Rack::Deflater
        use Rack::Session::Pool, :expire_after => 7200

        #declare/register Page Module for Rack middleware, check middleware.to_s
        #example: use Arowana::Page::LoginPage
        
        page_route_dir = App.root + '/app/routes/page'
        
        Resolver.get_all_klass_name(page_route_dir) { |klassname|
            use Object.const_get('Arowana::Page::' + klassname)
        }
        
        
        #declare/register API Module for Rack middleware, check middleware.to_s
        #example: use Arowana::RestAPI::WPTAPI
        api_route_dir = App.root + '/app/routes/api'
        
        Resolver.get_all_klass_name(api_route_dir) { |klassname|
            use Object.const_get('Arowana::RestAPI::' + klassname)
        }
       
    end
    
end
