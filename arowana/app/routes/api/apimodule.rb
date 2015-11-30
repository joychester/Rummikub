require 'util/reflection'

module Arowana
    module RestAPI
        
        dirname = File.expand_path(File.dirname(__FILE__))
        
        include Reflection
        
        Resolver.get_all_klass_name(dirname) { |klassname,filepath|
            # lazy load API routes, autoload is discouraged by Matz...
            # format "autoload :WPTAPI, 'app/routes/api/wptapi.rb"
            autoload klassname.to_sym, filepath
        }

        class BaseAPI < Arowana::Routes::RouteBase
            #todo
        end
    end
end
