module Arowana
    module Routes

        class RouteBase < Sinatra::Application

            configure do
                set :views, 'app/views'
            end
            
            #using before filters to check session expired, except /login, /logout, /rest Request
            before /^(?!\/(login|logout|rest|resources|fav|sw).*)/ do
                #In case you want to calculate the response time of each page request :)
                #Instance variables set in filters are accessible by routes and templates 
                @starttime = Time.now.to_f
                @resp_time = 0
                
                if session[:loginuser] == nil
                    LOGGER.info("Empty session, redirect to login page...")
                    redirect "/login"
                end
                
            end
        end
    end
end
